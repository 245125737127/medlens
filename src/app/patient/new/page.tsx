"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewPatientPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    sex: "",
    symptoms: "",
    conditions: "",
    allergies: "",
    medications: "",
    additional_notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/patients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          age: parseInt(formData.age),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create patient");
      }

      const data = await response.json();
      router.push(`/patient/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Patient Intake Form</h1>
        <p className="text-gray-600 mb-8">
          Please provide the following information. This data will be saved as <strong>Patient Provided</strong> and will not be automatically overwritten by AI.
        </p>

        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name *
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                />
              </div>
            </div>

            <div className="sm:col-span-1">
              <label htmlFor="age" className="block text-sm font-medium text-gray-700">
                Age *
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  name="age"
                  id="age"
                  required
                  min="0"
                  value={formData.age}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="sex" className="block text-sm font-medium text-gray-700">
                Sex *
              </label>
              <div className="mt-1">
                <select
                  id="sex"
                  name="sex"
                  required
                  value={formData.sex}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                >
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="sm:col-span-6">
              <label htmlFor="symptoms" className="block text-sm font-medium text-gray-700">
                Symptoms
              </label>
              <div className="mt-1">
                <textarea
                  id="symptoms"
                  name="symptoms"
                  rows={3}
                  value={formData.symptoms}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                />
              </div>
            </div>

            <div className="sm:col-span-6">
              <label htmlFor="conditions" className="block text-sm font-medium text-gray-700">
                Existing Medical Conditions
              </label>
              <div className="mt-1">
                <textarea
                  id="conditions"
                  name="conditions"
                  rows={2}
                  value={formData.conditions}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                />
              </div>
            </div>

            <div className="sm:col-span-6">
              <label htmlFor="allergies" className="block text-sm font-medium text-gray-700">
                Allergies
              </label>
              <div className="mt-1">
                <textarea
                  id="allergies"
                  name="allergies"
                  rows={2}
                  value={formData.allergies}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                />
              </div>
            </div>

            <div className="sm:col-span-6">
              <label htmlFor="medications" className="block text-sm font-medium text-gray-700">
                Current Medications
              </label>
              <div className="mt-1">
                <textarea
                  id="medications"
                  name="medications"
                  rows={3}
                  value={formData.medications}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                />
              </div>
            </div>
            
            <div className="sm:col-span-6">
              <label htmlFor="additional_notes" className="block text-sm font-medium text-gray-700">
                Additional Notes
              </label>
              <div className="mt-1">
                <textarea
                  id="additional_notes"
                  name="additional_notes"
                  rows={2}
                  value={formData.additional_notes}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                />
              </div>
            </div>
          </div>

          <div className="pt-5">
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
              >
                {loading ? "Saving..." : "Save Patient Information"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
