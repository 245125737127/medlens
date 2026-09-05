"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";

type LabResult = {
  id: number;
  test_name: string;
  value: number;
  unit?: string;
  reference_range?: string;
  status: string;
  date?: string;
  source_document?: string;
  source_page?: number;
  confidence: number;
  verified: boolean;
};

type Medication = {
  id: number;
  medication_name: string;
  strength_dose?: string;
  frequency?: string;
  date?: string;
  source_document?: string;
  source_page?: number;
  confidence: number;
  verified: boolean;
};

type Document = {
  id: number;
  filename: string;
  file_type: string;
  status: string;
};

type Conflict = {
  id: number;
  conflict_type: string;
  description: string;
  patient_provided_data?: string;
  extracted_data?: string;
  status: string;
};

type PatientData = {
  id: number;
  name: string;
  age: number;
  sex: string;
  symptoms?: string;
  conditions?: string;
  allergies?: string;
  medications?: string;
  additional_notes?: string;
  lab_results: LabResult[];
  extracted_medications: Medication[];
  documents: Document[];
  conflicts: Conflict[];
};

export default function PatientDashboard() {
  const params = useParams();
  const patientId = params?.id;
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{message: string, isError: boolean} | null>(null);
  const [selectedSource, setSelectedSource] = useState<{filename: string, page?: number} | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPatientData = async () => {
    if (!patientId) return;
    try {
      const res = await fetch(`http://localhost:8000/api/patients/${patientId}`);
      if (res.ok) {
        const data = await res.json();
        setPatientData(data);
      }
    } catch (err) {
      console.error("Failed to fetch patient data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();
    // Poll every 5 seconds if a document is processing
    const interval = setInterval(() => {
      if (patientData?.documents.some(doc => doc.status === 'Processing')) {
        fetchPatientData();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [patientId, patientData?.documents]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await uploadFile(e.target.files[0]);
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setUploadStatus(null);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`http://localhost:8000/api/patients/${patientId}/documents`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      setUploadStatus({ message: "Document uploaded successfully! Processing...", isError: false });
      fetchPatientData();
    } catch (err) {
      setUploadStatus({ message: "Failed to upload document", isError: true });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const openSourceViewer = (filename?: string, page?: number) => {
    if (filename) {
      setSelectedSource({ filename, page });
    }
  };

  const handleVerify = async (type: 'conflict' | 'lab' | 'med', id: number, action: 'accept' | 'reject' | 'edit', editedValue?: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/patients/${patientId}/verify/${type}/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, edited_value: editedValue })
      });
      if (res.ok) {
        fetchPatientData();
      }
    } catch (err) {
      console.error(`Failed to verify ${type}`, err);
    }
  };

  const generateSummary = async () => {
    setGeneratingSummary(true);
    try {
      const res = await fetch(`http://localhost:8000/api/patients/${patientId}/summary`);
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary_text);
      } else {
        setSummary("Failed to generate summary.");
      }
    } catch (err) {
      console.error("Failed to fetch summary", err);
      setSummary("Error connecting to server to generate summary.");
    } finally {
      setGeneratingSummary(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading patient dashboard...</div>;
  }

  if (!patientData) {
    return <div className="p-8 text-center text-red-500">Failed to load patient data.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Safety Notice */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-800 font-medium">
                MedLens organizes and explains available medical information. It does not provide medical diagnosis, treatment recommendations, or medication instructions. Information extracted by AI should be reviewed when indicated.
              </p>
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900">Patient Dashboard: {patientData.name}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Info & Upload */}
          <div className="lg:col-span-1 space-y-6">
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Patient Provided Info</h2>
              <dl className="grid grid-cols-1 gap-y-3 text-sm">
                <div><dt className="text-gray-500">Age / Sex</dt><dd className="font-medium text-gray-900">{patientData.age} / {patientData.sex}</dd></div>
                <div><dt className="text-gray-500">Symptoms</dt><dd className="font-medium text-gray-900">{patientData.symptoms || "None"}</dd></div>
                <div><dt className="text-gray-500">Conditions</dt><dd className="font-medium text-gray-900">{patientData.conditions || "None"}</dd></div>
                <div><dt className="text-gray-500">Allergies</dt><dd className="font-medium text-gray-900">{patientData.allergies || "None"}</dd></div>
                <div><dt className="text-gray-500">Current Medications</dt><dd className="font-medium text-gray-900 whitespace-pre-wrap">{patientData.medications || "None"}</dd></div>
              </dl>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Upload Medical Report</h2>
              <div 
                className="border-2 border-dashed border-blue-200 rounded-lg p-8 text-center hover:bg-blue-50 transition cursor-pointer bg-gray-50"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,image/*" />
                <svg className="mx-auto h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mt-2 text-sm text-gray-600 font-medium">Click to upload or drag & drop</p>
              </div>

              {uploading && (
                <div className="mt-3 text-sm text-blue-600 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div> Uploading...
                </div>
              )}
              {uploadStatus && (
                <div className={`mt-3 p-2 rounded text-xs ${uploadStatus.isError ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                  {uploadStatus.message}
                </div>
              )}

              {/* Documents List */}
              {patientData.documents.length > 0 && (
                <div className="mt-6 border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Uploaded Documents</h3>
                  <ul className="space-y-2">
                    {patientData.documents.map(doc => (
                      <li key={doc.id} className="flex justify-between items-center text-xs p-2 bg-gray-50 rounded border">
                        <span className="truncate w-32 cursor-pointer text-blue-600 hover:underline" onClick={() => openSourceViewer(doc.filename)}>
                          {doc.filename}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${
                          doc.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' : 
                          doc.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {doc.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Lab Results & Source Viewer */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* AI Summary Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  AI Clinical Summary
                </h2>
                <button 
                  onClick={generateSummary}
                  disabled={generatingSummary}
                  className="bg-purple-600 text-white px-4 py-2 rounded shadow-sm text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition"
                >
                  {generatingSummary ? "Generating..." : "Generate AI Summary"}
                </button>
              </div>
              {summary && (
                <div className="p-6 bg-purple-50">
                  <p className="text-sm text-purple-800 font-medium mb-4 italic">
                    Note: This is an AI-generated summary intended for informational purposes only. Do not use for medical diagnosis.
                  </p>
                  <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap">
                    {summary}
                  </div>
                </div>
              )}
            </div>

            {/* Medical Timeline Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Medical Timeline & Trends
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-6 border-l-2 border-blue-100 ml-3 pl-4">
                  {/* Sorting events by date (descending) */}
                  {[...patientData.lab_results.map(l => ({...l, type: 'lab'})), ...patientData.extracted_medications.map(m => ({...m, type: 'med'}))]
                    .filter(e => e.date)
                    .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime())
                    .map((event, index, sortedEvents) => {
                      let trend = null;
                      if (event.type === 'lab') {
                        // Find previous matching test to show trend
                        const previousTest = sortedEvents.find((e, i) => i > index && e.type === 'lab' && (e as any).test_name === (event as any).test_name);
                        if (previousTest && (previousTest as any).value !== undefined) {
                          const diff = (event as any).value - (previousTest as any).value;
                          if (diff > 0) trend = <span className="text-red-500 font-semibold ml-2">↑ +{diff.toFixed(2)}</span>;
                          else if (diff < 0) trend = <span className="text-green-500 font-semibold ml-2">↓ {diff.toFixed(2)}</span>;
                          else trend = <span className="text-gray-400 font-semibold ml-2">→ No Change</span>;
                        }
                      }
                      
                      return (
                        <div key={`${event.type}-${event.id}`} className="relative">
                          <div className={`absolute -left-6 w-4 h-4 rounded-full border-2 border-white ${event.type === 'lab' ? 'bg-blue-400' : 'bg-green-400'}`}></div>
                          <p className="text-sm text-gray-500 font-semibold mb-1">{event.date}</p>
                          <div className="bg-gray-50 border p-3 rounded">
                            {event.type === 'lab' ? (
                              <p className="text-gray-800 text-sm">
                                <strong>Lab Result:</strong> {(event as any).test_name} - {(event as any).value} {(event as any).unit} 
                                {trend}
                              </p>
                            ) : (
                              <p className="text-gray-800 text-sm">
                                <strong>Medication:</strong> {(event as any).medication_name} {(event as any).strength_dose}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                  {patientData.lab_results.length === 0 && patientData.extracted_medications.length === 0 && (
                    <p className="text-gray-500 text-sm italic">No dated events found in the patient record.</p>
                  )}
                </div>
              </div>
            </div>

            {selectedSource ? (
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 h-96 flex flex-col">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-md font-semibold text-gray-800">Source Viewer: {selectedSource.filename} {selectedSource.page && `(Page ${selectedSource.page})`}</h2>
                  <button onClick={() => setSelectedSource(null)} className="text-gray-400 hover:text-red-500">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="flex-1 border bg-gray-100 rounded flex items-center justify-center overflow-hidden relative">
                  {/* Using object tag to render pdfs or images */}
                  <object 
                    data={`http://localhost:8000/uploads/${selectedSource.filename}#page=${selectedSource.page || 1}`} 
                    type="application/pdf"
                    className="w-full h-full"
                  >
                    <p>Unable to display document directly. <a href={`http://localhost:8000/uploads/${selectedSource.filename}`} target="_blank" className="text-blue-500 underline" rel="noreferrer">Download here</a>.</p>
                  </object>
                </div>
              </div>
            ) : null}

            {/* Human Verification Section */}
            {(patientData.conflicts.filter(c => c.status === 'Needs Verification').length > 0 || 
              patientData.lab_results.some(l => l.confidence < 0.8 && !l.verified) || 
              patientData.extracted_medications.some(m => m.confidence < 0.8 && !m.verified)) && (
              <div className="bg-orange-50 rounded-lg shadow-sm border border-orange-200 overflow-hidden mb-6">
                <div className="p-4 border-b border-orange-200 bg-orange-100 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-orange-800 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    Action Required: Human Verification
                  </h2>
                </div>
                <div className="p-4 space-y-4">
                  {/* Conflicts */}
                  {patientData.conflicts.filter(c => c.status === 'Needs Verification').map(conflict => (
                    <div key={conflict.id} className="bg-white p-4 rounded border border-orange-200 shadow-sm">
                      <p className="font-semibold text-gray-800 text-sm">{conflict.conflict_type}</p>
                      <p className="text-sm text-gray-600 mt-1">{conflict.description}</p>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-gray-50 p-2 rounded">
                          <span className="font-medium text-gray-500">Patient Provided:</span>
                          <p className="mt-1">{conflict.patient_provided_data}</p>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                          <span className="font-medium text-gray-500">Extracted from Report:</span>
                          <p className="mt-1 font-medium">{conflict.extracted_data}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex space-x-2">
                        <button onClick={() => handleVerify('conflict', conflict.id, 'accept')} className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs font-medium hover:bg-green-200 transition">Accept Extracted</button>
                        <button onClick={() => handleVerify('conflict', conflict.id, 'reject')} className="bg-red-100 text-red-700 px-3 py-1 rounded text-xs font-medium hover:bg-red-200 transition">Keep Patient Provided</button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Low Confidence Labs */}
                  {patientData.lab_results.filter(l => l.confidence < 0.8 && !l.verified).map(lab => (
                    <div key={lab.id} className="bg-white p-4 rounded border border-yellow-200 shadow-sm flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">Low Confidence Extraction: Lab Result</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Test: <strong>{lab.test_name}</strong> | Value: <strong>{lab.value} {lab.unit}</strong> | Confidence: {(lab.confidence * 100).toFixed(0)}%
                        </p>
                      </div>
                      <div className="flex space-x-2 items-center">
                        <button onClick={() => openSourceViewer(lab.source_document, lab.source_page)} className="text-blue-600 text-xs hover:underline mr-2">View Source</button>
                        <button onClick={() => handleVerify('lab', lab.id, 'accept')} className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs font-medium hover:bg-green-200 transition">Verify Correct</button>
                        <button onClick={() => {
                          const newVal = prompt(`Edit value for ${lab.test_name}:`, lab.value.toString());
                          if(newVal !== null) handleVerify('lab', lab.id, 'edit', newVal);
                        }} className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-xs font-medium hover:bg-blue-200 transition">Edit</button>
                        <button onClick={() => handleVerify('lab', lab.id, 'reject')} className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-xs font-medium hover:bg-gray-200 transition">Discard</button>
                      </div>
                    </div>
                  ))}

                  {/* Low Confidence Meds */}
                  {patientData.extracted_medications.filter(m => m.confidence < 0.8 && !m.verified).map(med => (
                    <div key={med.id} className="bg-white p-4 rounded border border-yellow-200 shadow-sm flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">Low Confidence Extraction: Medication</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Medication: <strong>{med.medication_name} {med.strength_dose}</strong> | Confidence: {(med.confidence * 100).toFixed(0)}%
                        </p>
                      </div>
                      <div className="flex space-x-2 items-center">
                        <button onClick={() => openSourceViewer(med.source_document, med.source_page)} className="text-blue-600 text-xs hover:underline mr-2">View Source</button>
                        <button onClick={() => handleVerify('med', med.id, 'accept')} className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs font-medium hover:bg-green-200 transition">Verify Correct</button>
                        <button onClick={() => {
                          const newVal = prompt(`Edit medication name:`, med.medication_name);
                          if(newVal !== null) handleVerify('med', med.id, 'edit', newVal);
                        }} className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-xs font-medium hover:bg-blue-200 transition">Edit</button>
                        <button onClick={() => handleVerify('med', med.id, 'reject')} className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-xs font-medium hover:bg-gray-200 transition">Discard</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b bg-gray-50">
                <h2 className="text-xl font-semibold text-gray-800">Laboratory Results</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Range</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {patientData.lab_results.length === 0 ? (
                      <tr><td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">No lab results extracted yet.</td></tr>
                    ) : patientData.lab_results.map(lab => (
                      <tr key={lab.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{lab.test_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lab.value} <span className="text-gray-500">{lab.unit}</span></td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lab.reference_range || "Not provided"}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            lab.status === 'NORMAL' ? 'bg-green-100 text-green-800' :
                            lab.status === 'LOW' ? 'bg-yellow-100 text-yellow-800' :
                            lab.status === 'HIGH' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {lab.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className={`text-xs font-medium mr-2 ${lab.confidence < 0.8 ? 'text-red-600' : 'text-green-600'}`}>
                              {(lab.confidence * 100).toFixed(0)}%
                            </span>
                            {lab.confidence < 0.8 && !lab.verified && (
                              <span className="text-[10px] bg-red-100 text-red-800 px-1 rounded font-semibold cursor-pointer">Needs Verification</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={() => openSourceViewer(lab.source_document, lab.source_page)}
                            className="text-blue-600 hover:text-blue-900 text-xs flex items-center justify-end w-full"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b bg-gray-50">
                <h2 className="text-xl font-semibold text-gray-800">Extracted Medications</h2>
              </div>
              <ul className="divide-y divide-gray-200 p-2">
                {patientData.extracted_medications.length === 0 ? (
                  <li className="p-4 text-center text-sm text-gray-500">No medications extracted.</li>
                ) : patientData.extracted_medications.map(med => (
                  <li key={med.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{med.medication_name} {med.strength_dose}</p>
                      <p className="text-xs text-gray-500">{med.frequency} | {med.date}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className={`text-xs font-semibold ${med.confidence < 0.8 ? 'text-red-600' : 'text-green-600'}`}>
                           {(med.confidence * 100).toFixed(0)}% Conf
                        </p>
                        {med.confidence < 0.8 && !med.verified && <p className="text-[10px] text-red-500 font-bold">Needs Review</p>}
                      </div>
                      <button onClick={() => openSourceViewer(med.source_document, med.source_page)} className="text-gray-400 hover:text-blue-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
