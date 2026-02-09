import { supabase } from '../lib/supabase';

export interface BoardingPointImport {
  idbuspro: string;
  city: string;
  postal_code: string;
  address: string;
  description?: string;
  time?: string;
}

export interface HotelPartnerImport {
  idbuspro_partner_hotel: string;
  name: string;
  city: string;
  address?: string;
}

export interface ImportDiffSummary {
  newRecords: number;
  updatedRecords: number;
  unchangedRecords: number;
  errors: string[];
}

export function parseCSV(csvContent: string): any[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header row and one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const records: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const record: any = {};

    headers.forEach((header, index) => {
      record[header] = values[index] || '';
    });

    records.push(record);
  }

  return records;
}

export function parseJSON(jsonContent: string): any[] {
  try {
    const parsed = JSON.parse(jsonContent);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (error) {
    throw new Error('Invalid JSON format');
  }
}

export async function importBoardingPoints(
  records: BoardingPointImport[]
): Promise<ImportDiffSummary> {
  const summary: ImportDiffSummary = {
    newRecords: 0,
    updatedRecords: 0,
    unchangedRecords: 0,
    errors: [],
  };

  for (const record of records) {
    try {
      if (!record.idbuspro || !record.city || !record.postal_code || !record.address) {
        summary.errors.push(`Missing required fields for record: ${JSON.stringify(record)}`);
        continue;
      }

      const { data: existing, error: fetchError } = await supabase
        .from('boarding_points')
        .select('*')
        .eq('idbuspro', record.idbuspro)
        .maybeSingle();

      if (fetchError) {
        summary.errors.push(`Error fetching record ${record.idbuspro}: ${fetchError.message}`);
        continue;
      }

      const dataToUpsert = {
        idbuspro: record.idbuspro,
        city: record.city,
        plz: record.postal_code,
        address: record.address,
        beschreibung: record.description || '',
        time: record.time || '08:00',
        needs_enrichment: false,
      };

      if (!existing) {
        const { error: insertError } = await supabase
          .from('boarding_points')
          .insert(dataToUpsert);

        if (insertError) {
          summary.errors.push(`Error inserting ${record.idbuspro}: ${insertError.message}`);
        } else {
          summary.newRecords++;
        }
      } else {
        const hasChanges =
          existing.city !== dataToUpsert.city ||
          existing.plz !== dataToUpsert.plz ||
          existing.address !== dataToUpsert.address ||
          existing.beschreibung !== dataToUpsert.beschreibung ||
          existing.time !== dataToUpsert.time;

        if (hasChanges) {
          const { error: updateError } = await supabase
            .from('boarding_points')
            .update(dataToUpsert)
            .eq('id', existing.id);

          if (updateError) {
            summary.errors.push(`Error updating ${record.idbuspro}: ${updateError.message}`);
          } else {
            summary.updatedRecords++;
          }
        } else {
          summary.unchangedRecords++;
        }
      }
    } catch (error: any) {
      summary.errors.push(`Unexpected error for ${record.idbuspro}: ${error.message}`);
    }
  }

  return summary;
}

export async function importHotelPartners(
  records: HotelPartnerImport[]
): Promise<ImportDiffSummary> {
  const summary: ImportDiffSummary = {
    newRecords: 0,
    updatedRecords: 0,
    unchangedRecords: 0,
    errors: [],
  };

  for (const record of records) {
    try {
      if (!record.idbuspro_partner_hotel || !record.name || !record.city) {
        summary.errors.push(`Missing required fields for record: ${JSON.stringify(record)}`);
        continue;
      }

      const { data: existing, error: fetchError } = await supabase
        .from('hotel_partners')
        .select('*')
        .eq('idbuspro_partner_hotel', record.idbuspro_partner_hotel)
        .maybeSingle();

      if (fetchError) {
        summary.errors.push(
          `Error fetching record ${record.idbuspro_partner_hotel}: ${fetchError.message}`
        );
        continue;
      }

      const dataToUpsert = {
        idbuspro_partner_hotel: record.idbuspro_partner_hotel,
        name: record.name,
        city: record.city,
        address: record.address || '',
        needs_enrichment: false,
      };

      if (!existing) {
        const { error: insertError } = await supabase
          .from('hotel_partners')
          .insert(dataToUpsert);

        if (insertError) {
          summary.errors.push(
            `Error inserting ${record.idbuspro_partner_hotel}: ${insertError.message}`
          );
        } else {
          summary.newRecords++;
        }
      } else {
        const hasChanges =
          existing.name !== dataToUpsert.name ||
          existing.city !== dataToUpsert.city ||
          existing.address !== dataToUpsert.address;

        if (hasChanges) {
          const { error: updateError } = await supabase
            .from('hotel_partners')
            .update(dataToUpsert)
            .eq('id', existing.id);

          if (updateError) {
            summary.errors.push(
              `Error updating ${record.idbuspro_partner_hotel}: ${updateError.message}`
            );
          } else {
            summary.updatedRecords++;
          }
        } else {
          summary.unchangedRecords++;
        }
      }
    } catch (error: any) {
      summary.errors.push(
        `Unexpected error for ${record.idbuspro_partner_hotel}: ${error.message}`
      );
    }
  }

  return summary;
}
