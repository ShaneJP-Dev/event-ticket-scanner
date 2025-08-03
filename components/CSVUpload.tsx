import React, { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X, Download, Users, Ticket, Calendar } from 'lucide-react';
import Papa from 'papaparse';

// Import the existing useEvents hook
// Note: In your actual implementation, import this from the correct path
// import { useEvents } from '@/hooks/useEvents';

// Mock hook for demo - replace with actual import
const useEvents = () => {
  const [events, setEvents] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/events');
        if (!response.ok) throw new Error('Failed to fetch events');
        const data = await response.json();
        setEvents(data);
      } catch (err) {
        setError(err);
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

interface CSVUploadProps {
  onTicketsUploaded?: (tickets: CSVTicket[]) => void;
}

export default function CSVUpload({ onTicketsUploaded }: CSVUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
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

  // Handle events error
  React.useEffect(() => {
    if (eventsError) {
      setErrors(prev => [...prev, 'Failed to load events. Please refresh the page.']);
    }
  }, [eventsError]);

  // Debug: Log events data
  React.useEffect(() => {
    console.log('Events data:', events);
    console.log('Events loading:', isLoadingEvents);
    console.log('Events error:', eventsError);
  }, [events, isLoadingEvents, eventsError]);

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

        // Log the raw data for debugging
        console.log('Parsed CSV data:', results.data);
        console.log('CSV meta:', results.meta);

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

      console.log('Tickets to create:', ticketsToCreate); // Debug log

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
        console.error('API Error:', errorData); // Debug log
        throw new Error(errorData.error || errorData.errors?.[0]?.error || 'Failed to create tickets');
      }

      const result = await response.json();
      console.log('API Result:', result); // Debug log
      
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

  const validCount = validTickets.length;
  const invalidCount = csvData.length - validCount;
  const selectedEvent = events.find(e => e.id === selectedEventId);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Upload className="w-6 h-6" />
            Upload Tickets from CSV
          </h2>
        </div>

        <div className="p-6">
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
                <button 
                  onClick={downloadTemplate}
                  className="bg-white border border-blue-300 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-50 transition-colors"
                >
                  <Download className="w-4 h-4 inline mr-2" />
                  Download Template
                </button>
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
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  disabled={isLoadingEvents}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                >
                  <option value="">
                    {isLoadingEvents ? 'Loading events...' : 'Choose an event...'}
                  </option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name} ({new Date(event.startDate).toLocaleDateString()})
                    </option>
                  ))}
                </select>
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
                <button 
                  onClick={reset}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button 
                  onClick={handleUpload}
                  disabled={validCount === 0 || !selectedEventId || isLoadingEvents}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <Ticket className="w-4 h-4" />
                  Create {validCount} Tickets
                </button>
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
                <button 
                  onClick={() => setIsOpen(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
                <button 
                  onClick={reset}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Upload Another File
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}