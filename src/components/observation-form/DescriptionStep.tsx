'use client'

interface DescriptionStepProps {
  description: string
  onDescriptionChange: (description: string) => void
}

export default function DescriptionStep({ description, onDescriptionChange }: DescriptionStepProps) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4 text-gray-100">Observation Description</h2>
      <p className="text-gray-400 mb-6">
        Provide a detailed description of what you observed.
      </p>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Description *
        </label>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Describe your observation in detail..."
          className="w-full border border-gray-600 bg-gray-800 text-gray-100 rounded-md p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
          rows={10}
          required
        />
        <p className="text-sm text-gray-400 mt-2">
          {description.length} characters
        </p>
      </div>

      <div className="mt-6 bg-blue-900 border border-blue-700 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-300 mb-2">Tips for a good observation:</h3>
        <ul className="text-sm text-blue-200 space-y-1 list-disc list-inside">
          <li>Include specific details about what you saw</li>
          <li>Mention the date and time if relevant</li>
          <li>Describe environmental conditions</li>
          <li>Note any unusual or significant features</li>
        </ul>
      </div>
    </div>
  )
}
