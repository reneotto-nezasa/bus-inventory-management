import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function loadSeedData() {
  console.log('Clearing existing data...');

  await supabase.from('seat_assignments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('tour_guide_assignments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('early_bird_discounts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('trip_extras').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('composite_accommodation_hotels').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('accommodations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('boarding_point_surcharges').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('boarding_point_assignments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('transport_group_members').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('transport_groups').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('seats').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('seat_maps').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('bus_transports').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('boarding_points').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('transfer_cost_categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('trip_tags').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('trip_departures').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('trips').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('hotel_partners').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log('Loading hotel partners...');
  await supabase.from('hotel_partners').insert([
    { id: '00000000-0000-0000-0002-000000000001', idbuspro: '2', name: 'M-TOURS Erlebnisreisen GmbH', city: null, needs_enrichment: true },
    { id: '00000000-0000-0000-0002-000000000084', idbuspro: '84782', name: 'Grandhotel Pupp', city: 'Karlsbad', needs_enrichment: false },
    { id: '00000000-0000-0000-0002-000000000029', idbuspro: '29319', name: 'Hotel Dresden', city: 'Dresden', needs_enrichment: false },
    { id: '00000000-0000-0000-0002-000000061098', idbuspro: '61098', name: 'MS VOYAGE', city: 'River', needs_enrichment: false },
  ]);

  console.log('Loading boarding points...');
  const boardingPoints = [30, 50, 173, 296, 438, 477, 568, 600, 620, 647, 648, 649, 691, 707, 722, 723, 731, 800];
  await supabase.from('boarding_points').insert(
    boardingPoints.map(bp => ({
      id: `00000000-0000-0001-${String(bp).padStart(4, '0')}-000000000000`,
      idbuspro: String(bp),
      ort: `BP-${bp}`,
      stelle: '',
      status: 'freigegeben',
      needs_enrichment: true
    }))
  );

  console.log('Loading transfer cost categories...');
  await supabase.from('transfer_cost_categories').insert([
    { id: '00000000-0000-0000-0003-000000000001', name: 'Standard', sort_order: 0 },
    { id: '00000000-0000-0000-0003-000000000002', name: 'Premium', sort_order: 1 },
    { id: '00000000-0000-0000-0003-000000000003', name: 'Economy', sort_order: 2 },
  ]);

  console.log('Loading seat maps...');
  await supabase.from('seat_maps').insert([
    { id: '00000000-0000-0000-0004-000000000001', bezeichnung: 'Hummel 28+1', rows_count: 8, cols_count: 4 },
    { id: '00000000-0000-0000-0004-000000000002', bezeichnung: 'Növernann 44+1', rows_count: 12, cols_count: 4 },
  ]);

  console.log('Loading seats for Hummel bus...');
  const hummelSeats = [];
  hummelSeats.push({
    id: '00000000-0000-0004-0001-000000000001',
    seat_map_id: '00000000-0000-0000-0004-000000000001',
    row_index: 0,
    col_index: 0,
    label: 'D1',
    seat_type: 'driver',
    status: 'available'
  });

  for (let row = 1; row <= 7; row++) {
    for (let col = 0; col < 4; col++) {
      const letter = String.fromCharCode(65 + col);
      hummelSeats.push({
        id: `00000000-0000-0004-0001-0000000${String(row).padStart(2, '0')}${String(col + 1).padStart(2, '0')}`,
        seat_map_id: '00000000-0000-0000-0004-000000000001',
        row_index: row,
        col_index: col,
        label: `${row}${letter}`,
        seat_type: 'seat',
        status: 'available'
      });
    }
  }
  await supabase.from('seats').insert(hummelSeats);

  console.log('Loading seats for Növernann bus...');
  const novermannSeats = [];
  novermannSeats.push({
    id: '00000000-0000-0004-0002-000000000001',
    seat_map_id: '00000000-0000-0000-0004-000000000002',
    row_index: 0,
    col_index: 0,
    label: 'D1',
    seat_type: 'driver',
    status: 'available'
  });

  for (let row = 1; row <= 11; row++) {
    for (let col = 0; col < 4; col++) {
      const letter = String.fromCharCode(65 + col);
      novermannSeats.push({
        id: `00000000-0000-0004-0002-000000${String(row).padStart(4, '0')}${String(col + 1).padStart(2, '0')}`,
        seat_map_id: '00000000-0000-0000-0004-000000000002',
        row_index: row,
        col_index: col,
        label: `${row}${letter}`,
        seat_type: 'seat',
        status: 'available'
      });
    }
  }
  await supabase.from('seats').insert(novermannSeats);

  console.log('Loading Trip 1: Grandhotel Pupp...');
  await supabase.from('trips').insert({
    id: '00000000-0000-0000-0100-000000000001',
    code: '3544406',
    text: 'Grandhotel Pupp in Karlsbad',
    termin: '2026-04-13',
    bis: '2026-04-16',
    abpreis: 943.00,
    status_hin: 'Frei',
    status_rueck: 'Frei'
  });

  await supabase.from('trip_departures').insert({
    id: '00000000-0000-0000-0101-000000000001',
    trip_id: '00000000-0000-0000-0100-000000000001',
    start_date: '2026-04-13',
    end_date: '2026-04-16',
    code: '3544406',
    status_hin: 'Frei',
    status_rueck: 'Frei'
  });

  await supabase.from('trip_tags').insert([
    { trip_id: '00000000-0000-0000-0100-000000000001', dimension: 'category', value: 'Bus' },
    { trip_id: '00000000-0000-0000-0100-000000000001', dimension: 'level', value: 'Premium' },
    { trip_id: '00000000-0000-0000-0100-000000000001', dimension: 'region', value: 'Inland' },
  ]);

  await supabase.from('transport_groups').insert({
    id: '00000000-0000-0000-0103-000000000001',
    trip_departure_id: '00000000-0000-0000-0101-000000000001',
    label: 'Busreise',
    sort_order: 0
  });

  const { error: bt1Error } = await supabase.from('bus_transports').insert([
    {
      id: '00000000-0000-0000-0104-000000000001',
      trip_id: '00000000-0000-0000-0100-000000000001',
      trip_departure_id: '00000000-0000-0000-0101-000000000001',
      text: 'Bus Hinfahrt 13.04',
      richtung: 'HIN',
      termin: '2026-04-13',
      bis: '2026-04-13',
      preis: 0,
      status: 'Frei',
      sitzplan: true,
      unterart: 'BUS',
      seat_map_id: '00000000-0000-0000-0004-000000000001'
    },
    {
      id: '00000000-0000-0000-0104-000000000002',
      trip_id: '00000000-0000-0000-0100-000000000001',
      trip_departure_id: '00000000-0000-0000-0101-000000000001',
      text: 'Bus Rückfahrt 16.04',
      richtung: 'RUECK',
      termin: '2026-04-16',
      bis: '2026-04-16',
      preis: 0,
      status: 'Frei',
      sitzplan: true,
      unterart: 'BUS',
      seat_map_id: '00000000-0000-0000-0004-000000000001'
    }
  ]);
  if (bt1Error) console.error('Error loading Trip 1 transports:', bt1Error);

  console.log('Loading Trip 3: Dresden...');
  await supabase.from('trips').insert({
    id: '00000000-0000-0000-0300-000000000001',
    code: '3545779',
    text: 'Starke Frauen in Dresden',
    termin: '2026-03-06',
    bis: '2026-03-08',
    abpreis: 699.00,
    status_hin: 'Buchungsstop',
    status_rueck: 'Buchungsstop'
  });

  await supabase.from('trip_departures').insert({
    id: '00000000-0000-0000-0301-000000000001',
    trip_id: '00000000-0000-0000-0300-000000000001',
    start_date: '2026-03-06',
    end_date: '2026-03-08',
    code: '3545779',
    status_hin: 'Buchungsstop',
    status_rueck: 'Buchungsstop'
  });

  const { error: bt3Error } = await supabase.from('bus_transports').insert([
    {
      id: '00000000-0000-0000-0304-000000000001',
      trip_id: '00000000-0000-0000-0300-000000000001',
      trip_departure_id: '00000000-0000-0000-0301-000000000001',
      text: 'Bus Hinfahrt 06.03',
      richtung: 'HIN',
      termin: '2026-03-06',
      bis: '2026-03-06',
      preis: 0,
      status: 'Buchungsstop',
      sitzplan: true,
      unterart: 'BUS',
      seat_map_id: '00000000-0000-0000-0004-000000000002'
    },
    {
      id: '00000000-0000-0000-0304-000000000002',
      trip_id: '00000000-0000-0000-0300-000000000001',
      trip_departure_id: '00000000-0000-0000-0301-000000000001',
      text: 'Bus Rückfahrt 08.03',
      richtung: 'RUECK',
      termin: '2026-03-08',
      bis: '2026-03-08',
      preis: 0,
      status: 'Buchungsstop',
      sitzplan: true,
      unterart: 'BUS',
      seat_map_id: '00000000-0000-0000-0004-000000000002'
    }
  ]);
  if (bt3Error) console.error('Error loading Trip 3 transports:', bt3Error);

  console.log('Loading sample seat assignments for Dresden...');
  const { error: assignError } = await supabase.from('seat_assignments').insert([
    {
      seat_id: '00000000-0000-0004-0002-000000000101',
      bus_transport_id: '00000000-0000-0000-0304-000000000001',
      passenger_name: 'Maria Schmidt',
      passenger_email: 'maria.schmidt@example.com',
      passenger_phone: '030-1234567',
      booking_reference: 'BK-001'
    },
    {
      seat_id: '00000000-0000-0004-0002-000000000102',
      bus_transport_id: '00000000-0000-0000-0304-000000000001',
      passenger_name: 'Anna Müller',
      passenger_email: 'anna.mueller@example.com',
      passenger_phone: '040-9876543',
      booking_reference: 'BK-002'
    },
    {
      seat_id: '00000000-0000-0004-0002-000000000103',
      bus_transport_id: '00000000-0000-0000-0304-000000000001',
      passenger_name: 'Petra Weber',
      passenger_email: 'petra.weber@example.com',
      booking_reference: 'BK-003'
    }
  ]);
  if (assignError) console.error('Error loading seat assignments:', assignError);

  console.log('Verifying data...');
  const { data: trips } = await supabase.from('trips').select('*');
  console.log(`✓ Loaded ${trips?.length || 0} trips`);

  const { data: seats } = await supabase.from('seats').select('*');
  console.log(`✓ Loaded ${seats?.length || 0} seats`);

  const { data: assignments } = await supabase.from('seat_assignments').select('*');
  console.log(`✓ Loaded ${assignments?.length || 0} seat assignments`);

  console.log('\n✅ Seed data loaded successfully!');
}

loadSeedData().catch(console.error);
