import { NextResponse, type NextRequest } from 'next/server';
import { getSubmissionById, type CardSubmissionRow } from '@/lib/db';
import type { EstimateCardValueOutput } from '@/ai/flows/estimate-card-value';

interface ApiResponseData extends Omit<CardSubmissionRow, 'estimationsJson'> {
  estimations?: EstimateCardValueOutput | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { submissionId: string } }
) {
  const submissionId = params.submissionId;

  if (!submissionId || typeof submissionId !== 'string') {
    return NextResponse.json({ error: 'Invalid submission ID format.' }, { status: 400 });
  }

  try {
    const submission = await getSubmissionById(submissionId);

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found.' }, { status: 404 });
    }
    
    const responseData: ApiResponseData = { ...submission };
    if (submission.estimationsJson) {
      try {
        responseData.estimations = JSON.parse(submission.estimationsJson) as EstimateCardValueOutput;
      } catch (parseError) {
        console.error(`Error parsing estimationsJson for submission ${submissionId}:`, parseError);
        // If parsing fails, we can choose to return null or an empty array for estimations
        responseData.estimations = null; 
        // Optionally, update the status in DB to reflect this data corruption if critical
        // responseData.status = 'ERROR_DATA_CORRUPTION'; // Example
        // responseData.errorMessage = 'Failed to parse stored estimation data.';
      }
    }
    delete (responseData as any).estimationsJson; // Remove the JSON string version

    return NextResponse.json(responseData);
  } catch (error) {
    console.error(`Error fetching submission ${submissionId}:`, error);
    const message = error instanceof Error ? error.message : 'Failed to retrieve submission details.';
    return NextResponse.json({ error: `Server error: ${message}` }, { status: 500 });
  }
}
