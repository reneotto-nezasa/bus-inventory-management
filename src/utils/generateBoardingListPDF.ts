import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import pdfMake from './pdfConfig';
import { supabase } from '../lib/supabase';
import type { TourGuideAssignment } from '../types';

interface BoardingAssignment {
  id: string;
  boarding_point_id: string;
  passenger_first_name: string;
  passenger_last_name: string;
  passenger_phone: string | null;
  seat_label: string | null;
  booking_code: string | null;
  destination: string | null;
  boarding_points: {
    time: string;
    plz: string;
    city: string;
    address: string;
  };
}

interface BoardingListData {
  trip: {
    code: string;
    text: string;
    start_date: string;
    end_date: string;
  };
  transport: {
    bus_type_name: string;
  };
  tourGuides: TourGuideAssignment[];
  assignments: BoardingAssignment[];
}

async function fetchBoardingListData(transportId: string): Promise<BoardingListData | null> {
  try {
    const { data: transport, error: transportError } = await supabase
      .from('bus_transports')
      .select(`
        *,
        trip_departures!inner(
          id,
          termin,
          trips!inner(
            code,
            text,
            start_date,
            end_date
          )
        )
      `)
      .eq('id', transportId)
      .single();

    if (transportError) throw transportError;
    if (!transport) return null;

    const { data: assignments, error: assignmentsError } = await supabase
      .from('boarding_point_assignments')
      .select(`
        *,
        boarding_points!inner(
          time,
          plz,
          city,
          address
        )
      `)
      .eq('bus_transport_id', transportId)
      .order('boarding_points(time)', { ascending: true });

    if (assignmentsError) throw assignmentsError;

    const departureId = transport.trip_departures?.id;
    let tourGuides: TourGuideAssignment[] = [];
    if (departureId) {
      const { data: guides } = await supabase
        .from('tour_guide_assignments')
        .select('*')
        .eq('trip_departure_id', departureId);
      tourGuides = (guides || []) as TourGuideAssignment[];
    }

    return {
      trip: {
        code: transport.trip_departures.trips.code,
        text: transport.trip_departures.trips.text,
        start_date: transport.trip_departures.trips.start_date,
        end_date: transport.trip_departures.trips.end_date,
      },
      transport: {
        bus_type_name: transport.bus_type_name,
      },
      tourGuides,
      assignments: (assignments || []) as BoardingAssignment[],
    };
  } catch (error) {
    console.error('Error fetching boarding list data:', error);
    return null;
  }
}

function groupByBoardingPoint(assignments: BoardingAssignment[]) {
  const groups = new Map<string, BoardingAssignment[]>();

  for (const assignment of assignments) {
    const pointId = assignment.boarding_point_id;
    if (!groups.has(pointId)) {
      groups.set(pointId, []);
    }
    groups.get(pointId)!.push(assignment);
  }

  return Array.from(groups.entries()).map(([pointId, items]) => ({
    boardingPoint: items[0].boarding_points,
    passengers: items,
  }));
}

export async function generateBoardingListPDF(transportId: string): Promise<void> {
  const data = await fetchBoardingListData(transportId);

  if (!data) {
    throw new Error('Failed to fetch boarding list data');
  }

  const groups = groupByBoardingPoint(data.assignments);
  const content: any[] = [];

  content.push(
    {
      text: 'Zustiegsliste',
      style: 'title',
      fontSize: 18,
      bold: true,
      margin: [0, 0, 0, 5],
    },
    {
      columns: [
        {
          width: '*',
          stack: [
            { text: `Reise: ${data.trip.code} - ${data.trip.text}`, fontSize: 10 },
            {
              text: `Zeitraum: ${new Date(data.trip.start_date).toLocaleDateString(
                'de-DE'
              )} - ${new Date(data.trip.end_date).toLocaleDateString('de-DE')}`,
              fontSize: 10,
            },
            { text: `Bustyp: ${data.transport.bus_type_name}`, fontSize: 10 },
          ],
        },
        {
          width: 'auto',
          stack: data.tourGuides.length > 0
            ? data.tourGuides.map((g) => {
                const name = g.first_name ? `${g.first_name} ${g.name}` : (g.name || '-');
                const codeStr = g.code ? ` (${g.code})` : '';
                return {
                  text: `Reiseleiter: ${name}${codeStr}`,
                  fontSize: 10,
                  alignment: 'right' as const,
                };
              })
            : [
                {
                  text: 'Reiseleiter: -',
                  fontSize: 10,
                  alignment: 'right' as const,
                },
              ],
        },
      ],
      margin: [0, 0, 0, 20],
    }
  );

  let runningTotal = 0;

  for (const group of groups) {
    const { boardingPoint, passengers } = group;

    content.push({
      text: `${boardingPoint.time} • ${boardingPoint.plz} ${boardingPoint.city} • ${boardingPoint.address}`,
      style: 'sectionHeader',
      fontSize: 11,
      bold: true,
      fillColor: '#e3f2fd',
      margin: [0, 10, 0, 5],
    });

    const tableBody: any[] = [];

    tableBody.push([
      { text: 'Sitz', style: 'tableHeader', alignment: 'center' },
      { text: 'Nachname', style: 'tableHeader' },
      { text: 'Vorname', style: 'tableHeader' },
      { text: 'Telefon', style: 'tableHeader' },
      { text: 'Buchungscode', style: 'tableHeader' },
      { text: 'Ziel', style: 'tableHeader' },
    ]);

    for (const passenger of passengers) {
      tableBody.push([
        { text: passenger.seat_label || '-', alignment: 'center', fontSize: 9 },
        { text: passenger.passenger_last_name || '-', fontSize: 9 },
        { text: passenger.passenger_first_name || '-', fontSize: 9 },
        { text: passenger.passenger_phone || '-', fontSize: 9 },
        { text: passenger.booking_code || '-', fontSize: 9 },
        { text: passenger.destination || '-', fontSize: 9 },
      ]);
    }

    content.push({
      table: {
        headerRows: 1,
        widths: [40, '*', '*', 80, 80, 80],
        body: tableBody,
      },
      layout: {
        fillColor: (rowIndex: number) => (rowIndex === 0 ? '#f5f5f5' : null),
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => '#e0e0e0',
        vLineColor: () => '#e0e0e0',
      },
    });

    runningTotal += passengers.length;

    content.push({
      text: `Zugestiegen: ${passengers.length} | Gesamt: ${runningTotal}`,
      fontSize: 9,
      bold: true,
      alignment: 'right',
      margin: [0, 5, 0, 0],
      color: '#1976d2',
    });
  }

  content.push({
    text: `\nGesamt Passagiere: ${data.assignments.length}`,
    fontSize: 12,
    bold: true,
    margin: [0, 20, 0, 0],
  });

  const docDefinition: TDocumentDefinitions = {
    pageSize: 'A4',
    pageOrientation: 'landscape',
    pageMargins: [40, 60, 40, 60],
    header: {
      margin: [40, 20, 40, 0],
      text: 'M-TOURS Erlebnisreisen GmbH',
      style: 'header',
      bold: true,
      fontSize: 14,
    },
    content,
    footer: (currentPage, pageCount) => ({
      margin: [40, 10, 40, 0],
      columns: [
        {
          text: `Erstellt am: ${new Date().toLocaleDateString('de-DE')} ${new Date().toLocaleTimeString(
            'de-DE'
          )}`,
          fontSize: 8,
          alignment: 'left',
        },
        {
          text: `Seite ${currentPage} von ${pageCount}`,
          fontSize: 8,
          alignment: 'right',
        },
      ],
    }),
    styles: {
      header: {
        fontSize: 14,
        bold: true,
      },
      title: {
        fontSize: 18,
        bold: true,
      },
      sectionHeader: {
        fontSize: 11,
        bold: true,
        fillColor: '#e3f2fd',
      },
      tableHeader: {
        bold: true,
        fontSize: 9,
        fillColor: '#f5f5f5',
      },
    },
  };

  const pdf = await pdfMake.createPdf(docDefinition);
  pdf.download(`Zustiegsliste_${data.trip.code.replace(/\s+/g, '_')}.pdf`);
}
