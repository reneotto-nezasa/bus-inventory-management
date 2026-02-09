import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function loadSeedData() {
  try {
    const sql = readFileSync('./supabase/seed-data.sql', 'utf-8');

    console.log('Loading seed data...');

    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Executing ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length > 10) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });
          if (error) {
            console.error(`Error on statement ${i + 1}:`, error.message);
          }
        } catch (e: any) {
          console.error(`Exception on statement ${i + 1}:`, e.message);
        }
      }

      if ((i + 1) % 10 === 0) {
        console.log(`Processed ${i + 1}/${statements.length} statements...`);
      }
    }

    console.log('Seed data loaded successfully!');

    const { data: trips, error: tripsError } = await supabase
      .from('trips')
      .select('*');

    if (tripsError) {
      console.error('Error fetching trips:', tripsError);
    } else {
      console.log(`\nLoaded ${trips?.length || 0} trips:`);
      trips?.forEach((trip: any) => {
        console.log(`  - ${trip.name} (${trip.code})`);
      });
    }

  } catch (error: any) {
    console.error('Failed to load seed data:', error.message);
    process.exit(1);
  }
}

loadSeedData();
