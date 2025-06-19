import sqlite3 from 'sqlite3';
import { open, type Database } from 'sqlite';
import path from 'path';
import type { EstimateCardValueOutput } from '@/ai/flows/estimate-card-value';

const DB_FILE_PATH = path.join(process.cwd(), 'pokemon_cards.db');

export interface CardSubmissionRow {
  id: string;
  imageDataUri: string;
  cardName?: string | null;
  cardNumber?: string | null;
  deckIdLetter?: string | null;
  illustratorName?: string | null;
  estimationsJson?: string | null; // JSON string of EstimateCardValueOutput
  status: 'PROCESSING_IDENTIFICATION' | 'PROCESSING_VALUATION' | 'COMPLETED' | 'ERROR_IDENTIFICATION' | 'ERROR_VALUATION';
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

let db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!db) {
    db = await open({
      filename: DB_FILE_PATH,
      driver: sqlite3.Database,
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS card_submissions (
        id TEXT PRIMARY KEY,
        imageDataUri TEXT NOT NULL,
        cardName TEXT,
        cardNumber TEXT,
        deckIdLetter TEXT,
        illustratorName TEXT,
        estimationsJson TEXT,
        status TEXT NOT NULL,
        errorMessage TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `);
  }
  return db;
}

export async function insertNewSubmission(id: string, imageDataUri: string): Promise<void> {
  const connection = await getDb();
  const now = new Date().toISOString();
  await connection.run(
    'INSERT INTO card_submissions (id, imageDataUri, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
    id,
    imageDataUri,
    'PROCESSING_IDENTIFICATION',
    now,
    now
  );
}

export async function updateSubmissionWithIdentification(
  id: string,
  cardDetails: { cardName: string; cardNumber: string; deckIdLetter?: string; illustratorName?: string },
  status: CardSubmissionRow['status']
): Promise<void> {
  const connection = await getDb();
  const now = new Date().toISOString();
  await connection.run(
    'UPDATE card_submissions SET cardName = ?, cardNumber = ?, deckIdLetter = ?, illustratorName = ?, status = ?, updatedAt = ?, errorMessage = NULL WHERE id = ?',
    cardDetails.cardName,
    cardDetails.cardNumber,
    cardDetails.deckIdLetter || null,
    cardDetails.illustratorName || null,
    status,
    now,
    id
  );
}

export async function updateSubmissionWithValuation(
  id: string,
  estimations: EstimateCardValueOutput,
  status: CardSubmissionRow['status']
): Promise<void> {
  const connection = await getDb();
  const now = new Date().toISOString();
  await connection.run(
    'UPDATE card_submissions SET estimationsJson = ?, status = ?, updatedAt = ?, errorMessage = NULL WHERE id = ?',
    JSON.stringify(estimations),
    status,
    now,
    id
  );
}

export async function updateSubmissionWithError(id: string, status: CardSubmissionRow['status'], errorMessage: string): Promise<void> {
  const connection = await getDb();
  const now = new Date().toISOString();
  await connection.run(
    'UPDATE card_submissions SET status = ?, errorMessage = ?, updatedAt = ? WHERE id = ?',
    status,
    errorMessage,
    now,
    id
  );
}

export async function getSubmissionById(id: string): Promise<CardSubmissionRow | undefined> {
  const connection = await getDb();
  const row = await connection.get<CardSubmissionRow>('SELECT * FROM card_submissions WHERE id = ?', id);
  return row;
}
