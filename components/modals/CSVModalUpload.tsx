// app/components/CSVUploadModal.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X, Download, Users, Ticket, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Papa from 'papaparse';

// Import the existing useEvents hook
// Note: In your actual implementation, import this from the correct path
// import { useEvents } from '@/hooks/useEvents';

// Define the Event type to match your actual Event type
interface Event {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  description?: string;
  location?: string;
  // Add other properties as needed
}

// Mock hook for demo - replace with actual import
const useEvents = () => {
  const [events, setEvents] = React.useState<Event[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/events');
        if (!response.ok) throw new Error('Failed to fetch events');
        const data: Event[] = await response.json();
        setEvents(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, []);

  return { data: events, isLoading, error };
};

interface CSVTicket {
  name: string;
  surname: string;
  code?: string;
  errors?: string[];
  isValid?: boolean;
}

interface CSVUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTicketsUploaded?: (tickets: CSVTicket[]) => void;
}

export default function CSVUploadModal({ isOpen, onClose, onTicketsUploaded }: CSVUploadModalProps) {
  const [csvData, setCsvData] = useState<CSVTicket[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [validTickets, setValidTickets] = useState<CSVTicket[]>([]);
  const [step, setStep] = useState<'upload' | 'preview' | 'processing' | 'complete'>('upload');

  // Use the existing useEvents hook
  const { data: events = [], isLoading: isLoadingEvents, error: eventsError } = useEvents();

  const expectedHeaders = ['name', 'surname'];
  const requiredHeaders = ['name', 'surname'];

  // Reset modal when opened/closed
  useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen]);

  // Handle events error
  useEffect(() => {
    if (eventsError) {
      setErrors(prev => [...prev, 'Failed to load events. Please refresh the page.']);
    }
  }, [eventsError]);

  const generateTicketCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const validateCSVData = useCallback((data: any[]): CSVTicket[] => {
    const validatedTickets: CSVTicket[] = [];
    const newErrors: string[] = [];

    if (data.length === 0) {
      newErrors.push('CSV file is empty');
      setErrors(newErrors);
      return [];
    }

    // Check headers
    const headers = Object.keys(data[0] || {});
    const missingRequired = requiredHeaders.filter(header => 
      !headers.some(h => h.toLowerCase().trim() === header.toLowerCase())
    );

    if (missingRequired.length > 0) {
      newErrors.push(`Missing required columns: ${missingRequired.join(', ')}`);
    }

    data.forEach((row, index) => {
      const ticket: CSVTicket = {
        name: '',
        surname: '',
        code: generateTicketCode(),
        errors: [],
        isValid: true
      };

      // Normalize and extract data
      Object.entries(row).forEach(([key, value]) => {
        const normalizedKey = key.toLowerCase().trim();
        const stringValue = String(value || '').trim();

        switch (normalizedKey) {
          case 'name':
          case 'first name':
          case 'firstname':
            ticket.name = stringValue;
            break;
          case 'surname':
          case 'last name':
          case 'lastname':
            ticket.surname = stringValue;
            break;
        }
      });

      // Validate required fields
      if (!ticket.name) {
        ticket.errors?.push('Name is required');
        ticket.isValid = false;
      }

      if (!ticket.surname) {
        ticket.errors?.push('Surname is required');
        ticket.isValid = false;
      }

      if (ticket.errors && ticket.errors.length > 0) {
        newErrors.push(`Row ${index + 2}: ${ticket.errors.join(', ')}`);
      }

      validatedTickets.push(ticket);
    });

    setErrors(newErrors);
    return validatedTickets;
  }, []);

  const handleFileSelect = useCallback((selectedFile: File) => {
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setErrors(['Please select a CSV file']);
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
      setErrors(['File size must be less than 5MB']);
      return;
    }

    setFile(selectedFile);
    setErrors([]);
    
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      dynamicTyping: false,
      encoding: 'UTF-8',
      complete: (results) => {
        // Filter out parsing errors that are just warnings about field count
        const criticalErrors = results.errors.filter(error => 
          !error.message.includes('Too few fields') && 
          !error.message.includes('Too many fields')
        );
        
        if (criticalErrors.length > 0) {
          setErrors(criticalErrors.map(e => e.message));
          return;
        }

        const validated = validateCSVData(results.data);
        setCsvData(validated);
        setValidTickets(validated.filter(t => t.isValid));
        setStep('preview');
      },
      error: (error) => {
        setErrors([`Failed to parse CSV: ${error.message}`]);
      }
    });
  }, [validateCSVData]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleUpload = async () => {
    if (!selectedEventId) {
      setErrors(['Please select an event before uploading']);
      return;
    }

    if (validTickets.length === 0) {
      setErrors(['No valid tickets to upload']);
      return;
    }

    setIsProcessing(true);
    setStep('processing');
    
    try {
      // Convert valid tickets to the format expected by the API
      const ticketsToCreate = validTickets.map(ticket => ({
        name: ticket.name,
        surname: ticket.surname,
        eventId: selectedEventId
      }));

      // Simulate progress while making the actual API call
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Make the actual API call to bulk create tickets
      const response = await fetch('/api/tickets/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tickets: ticketsToCreate,
          eventId: selectedEventId
        }),
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.errors?.[0]?.error || 'Failed to create tickets');
      }

      const result = await response.json();
      
      // Update the success message based on results
      if (result.failed > 0) {
        setErrors([
          `Created ${result.created} tickets successfully`,
          `${result.failed} tickets failed to create`,
          ...(result.errors?.map((err: any) => `Row ${err.index + 1}: ${err.error}`) || [])
        ]);
      }

      // Call the callback with the created tickets
      if (onTicketsUploaded && result.tickets) {
        onTicketsUploaded(result.tickets);
      }

      setStep('complete');
      
    } catch (error) {
      console.error('Upload failed:', error);
      setErrors([`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`]);
      setStep('preview'); // Go back to preview to show errors
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        name: 'John',
        surname: 'Doe'
      },
      {
        name: 'Jane',
        surname: 'Smith'
      }
    ];

    const csv = Papa.unparse(templateData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tickets-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const reset = () => {
    setFile(null);
    setCsvData([]);
    setValidTickets([]);
    setErrors([]);
    setSelectedEventId('');
    setStep('upload');
    setUploadProgress(0);
    setIsProcessing(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const validCount = validTickets.length;
  const invalidCount = csvData.length - validCount;
  const selectedEvent = events.find(e => e.id === selectedEventId);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Tickets from CSV
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Upload Area */}
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">Drop your CSV file here</h3>
                <p className="text-gray-600 mb-4">or click to browse</p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                  id="csv-upload"
                />
                <label 
                  htmlFor="csv-upload"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer inline-flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Choose File
                </label>
              </div>

              {/* Template Download */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Need a template?
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  Download our CSV template to ensure your file has the correct format.
                </p>
                <Button 
                  onClick={downloadTemplate}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Template
                </Button>
              </div>

              {/* Format Requirements */}
              <div className="space-y-3">
                <h4 className="font-medium">Required CSV Format:</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• <strong>name</strong> (required): First name</li>
                  <li>• <strong>surname</strong> (required): Last name</li>
                </ul>
                <p className="text-sm text-gray-500 italic">
                  Note: Ticket codes will be automatically generated for each person.
                </p>
              </div>

              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    <div>
                      <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                        {errors.map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">{file?.name}</span>
                  </div>
                  <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-sm">
                    {csvData.length} total rows
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    {validCount} valid
                  </span>
                  {invalidCount > 0 && (
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {invalidCount} invalid
                    </span>
                  )}
                </div>
              </div>

              {/* Event Selection */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Select Event for Tickets
                </h4>
                <Select
                  value={selectedEventId}
                  onValueChange={setSelectedEventId}
                  disabled={isLoadingEvents}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={isLoadingEvents ? 'Loading events...' : 'Choose an event...'} />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.name} ({new Date(event.startDate).toLocaleDateString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {events.length === 0 && !isLoadingEvents && !eventsError && (
                  <p className="text-sm text-red-600 mt-2">
                    No events found. Please create an event first.
                  </p>
                )}
                {eventsError && (
                  <p className="text-sm text-red-600 mt-2">
                    Error loading events. Please refresh the page.
                  </p>
                )}
                {selectedEvent && (
                  <p className="text-sm text-gray-600 mt-2">
                    Selected: <strong>{selectedEvent.name}</strong> - {' '}
                    {new Date(selectedEvent.startDate).toLocaleDateString()} to {' '}
                    {new Date(selectedEvent.endDate).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Errors Summary */}
              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    <div className="max-h-32 overflow-y-auto">
                      <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                        {errors.slice(0, 10).map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                        {errors.length > 10 && (
                          <li>... and {errors.length - 10} more errors</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Data Preview */}
              <div className="border rounded-lg">
                <div className="max-h-64 overflow-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Status</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Name</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Surname</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Ticket Code</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Errors</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {csvData.slice(0, 20).map((ticket, index) => (
                        <tr key={index} className={!ticket.isValid ? 'bg-red-50' : ''}>
                          <td className="px-4 py-2">
                            {ticket.isValid ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-600" />
                            )}
                          </td>
                          <td className="px-4 py-2 text-sm">{ticket.name}</td>
                          <td className="px-4 py-2 text-sm">{ticket.surname}</td>
                          <td className="px-4 py-2 text-sm font-mono text-blue-600">{ticket.code}</td>
                          <td className="px-4 py-2">
                            {ticket.errors && ticket.errors.length > 0 ? (
                              <div className="text-xs text-red-600">
                                {ticket.errors.join(', ')}
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {csvData.length > 20 && (
                  <div className="p-2 text-center text-sm text-gray-500 border-t">
                    Showing first 20 of {csvData.length} rows
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-between">
                <Button 
                  onClick={reset}
                  variant="outline"
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Back
                </Button>
                <Button 
                  onClick={handleUpload}
                  disabled={validCount === 0 || !selectedEventId || isLoadingEvents}
                  className="gap-2"
                >
                  <Ticket className="w-4 h-4" />
                  Create {validCount} Tickets
                </Button>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="space-y-6 text-center py-8">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">Creating Tickets...</h3>
                <p className="text-gray-600 mb-4">
                  Processing {validCount} valid tickets for {selectedEvent?.name}.
                </p>
                <div className="max-w-sm mx-auto">
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500">{uploadProgress}% complete</p>
                </div>
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="space-y-6 text-center py-8">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">Upload Complete!</h3>
                <p className="text-gray-600">
                  Successfully created {validCount} tickets for {selectedEvent?.name}.
                </p>
                {invalidCount > 0 && (
                  <p className="text-sm text-orange-600 mt-2">
                    {invalidCount} rows were skipped due to validation errors.
                  </p>
                )}
              </div>
              <div className="flex justify-center gap-3">
                <Button 
                  onClick={handleClose}
                  variant="outline"
                >
                  Close
                </Button>
                <Button 
                  onClick={reset}
                  className="gap-2"
                >
                  Upload Another File
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}