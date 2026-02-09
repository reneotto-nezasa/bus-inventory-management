import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import pdfMake from './pdfConfig';
import { supabase } from '../lib/supabase';
import type { SeatMap, SeatAssignment, TourGuideAssignment } from '../types';

interface SeatPlanData {
  trip: {
    text: string;
    start_date: string;
    end_date: string;
  };
  transport: {
    bus_type_name: string;
  };
  seatMap: SeatMap;
  assignments: SeatAssignment[];
  tourGuides: TourGuideAssignment[];
  blockedSeats: Array<{ label: string; block_reason: string | null }>;
}

async function fetchSeatPlanData(transportId: string): Promise<SeatPlanData | null> {
  try {
    const { data: transport, error: transportError } = await supabase
      .from('bus_transports')
      .select(`
        *,
        trip_departures!inner(
          id,
          termin,
          trips!inner(
            text,
            start_date,
            end_date
          )
        ),
        seat_maps!inner(*)
      `)
      .eq('id', transportId)
      .single();

    if (transportError) throw transportError;
    if (!transport) return null;

    const { data: assignments, error: assignmentsError } = await supabase
      .from('seat_assignments')
      .select('*')
      .eq('bus_transport_id', transportId);

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

    let blockedSeats: Array<{ label: string; block_reason: string | null }> = [];
    if (transport.seat_maps?.id) {
      const { data: seats } = await supabase
        .from('seats')
        .select('label, block_reason')
        .eq('seat_map_id', transport.seat_maps.id)
        .eq('is_blocked', true);
      blockedSeats = seats || [];
    }

    return {
      trip: {
        text: transport.trip_departures.trips.text,
        start_date: transport.trip_departures.trips.start_date,
        end_date: transport.trip_departures.trips.end_date,
      },
      transport: {
        bus_type_name: transport.bus_type_name,
      },
      seatMap: transport.seat_maps,
      assignments: assignments || [],
      tourGuides,
      blockedSeats,
    };
  } catch (error) {
    console.error('Error fetching seat plan data:', error);
    return null;
  }
}

function buildSeatGrid(data: SeatPlanData) {
  const { seatMap, assignments, blockedSeats } = data;
  const layout = JSON.parse(seatMap.layout);
  const rows = layout.length;

  const assignmentMap = new Map(
    assignments.map((a) => [a.seat_label, a])
  );

  const blockedMap = new Map(
    blockedSeats.map((s) => [s.label, s.block_reason])
  );

  const tableBody: any[] = [];

  tableBody.push([
    { text: '', style: 'tableHeader', border: [false, false, false, false] },
    { text: 'A', style: 'tableHeader', alignment: 'center' },
    { text: 'B', style: 'tableHeader', alignment: 'center' },
    { text: '', style: 'tableHeader', border: [false, false, false, false] },
    { text: 'C', style: 'tableHeader', alignment: 'center' },
    { text: 'D', style: 'tableHeader', alignment: 'center' },
  ]);

  for (let row = 0; row < rows; row++) {
    const rowData: any[] = [];

    rowData.push({
      text: (row + 1).toString(),
      style: 'rowNumber',
      alignment: 'center',
      border: [false, false, false, false],
    });

    const columns = ['A', 'B', 'C', 'D'];
    for (let colIdx = 0; colIdx < columns.length; colIdx++) {
      const col = columns[colIdx];
      const seatLabel = `${row + 1}${col}`;
      const seat = layout[row]?.[colIdx];

      if (colIdx === 2) {
        rowData.push({
          text: '',
          border: [false, false, false, false],
        });
      }

      if (!seat) {
        rowData.push({
          text: '',
          fillColor: '#f5f5f5',
        });
        continue;
      }

      const assignment = assignmentMap.get(seatLabel);
      const blockReason = blockedMap.get(seatLabel);
      const isTourGuideSeat = blockReason?.startsWith('Reiseleiter:');
      let cellContent = '';
      let fillColor = '#ffffff';

      if (seat.type === 'driver') {
        cellContent = 'Fahrer';
        fillColor = '#e3f2fd';
      } else if (seat.type === 'guide' || isTourGuideSeat) {
        cellContent = 'RL';
        fillColor = '#ede9fe';
      } else if (seat.type === 'wc') {
        cellContent = 'WC';
        fillColor = '#f5f5f5';
      } else if (seat.type === 'kitchen') {
        cellContent = 'Kueche';
        fillColor = '#f5f5f5';
      } else if (seat.blocked || blockReason) {
        cellContent = 'X';
        fillColor = '#ffebee';
      } else if (assignment) {
        const name = `${assignment.last_name || ''}, ${assignment.first_name || ''}`.trim();
        const pref = assignment.seat_preference ? `\n(${assignment.seat_preference})` : '';
        cellContent = `${seatLabel}\n${name}${pref}`;
        fillColor = '#e8f5e9';
      } else {
        cellContent = seatLabel;
        fillColor = '#ffffff';
      }

      rowData.push({
        text: cellContent,
        alignment: 'center',
        fontSize: 8,
        fillColor,
      });
    }

    tableBody.push(rowData);
  }

  return tableBody;
}

export async function generateSeatPlanPDF(transportId: string): Promise<void> {
  const data = await fetchSeatPlanData(transportId);

  if (!data) {
    throw new Error('Failed to fetch seat plan data');
  }

  const tableBody = buildSeatGrid(data);

  const docDefinition: TDocumentDefinitions = {
    pageSize: 'A4',
    pageOrientation: 'portrait',
    pageMargins: [40, 80, 40, 60],
    header: {
      margin: [40, 20, 40, 0],
      columns: [
        {
          width: '*',
          stack: [
            {
              text: 'M-TOURS Erlebnisreisen GmbH',
              style: 'header',
              bold: true,
              fontSize: 14,
            },
            {
              text: 'Sitzplan',
              style: 'subheader',
              fontSize: 12,
              margin: [0, 5, 0, 0],
            },
          ],
        },
      ],
    },
    content: [
      {
        text: data.trip.text,
        style: 'title',
        fontSize: 16,
        bold: true,
        margin: [0, 0, 0, 5],
      },
      {
        text: `${new Date(data.trip.start_date).toLocaleDateString('de-DE')} - ${new Date(
          data.trip.end_date
        ).toLocaleDateString('de-DE')}`,
        fontSize: 10,
        margin: [0, 0, 0, 5],
      },
      {
        text: `Bustyp: ${data.transport.bus_type_name}`,
        fontSize: 10,
        margin: [0, 0, 0, 5],
      },
      ...(data.tourGuides.length > 0
        ? [
            {
              text: `Reiseleiter: ${data.tourGuides
                .map((g) => {
                  const name = g.first_name ? `${g.first_name} ${g.name}` : g.name;
                  return g.code ? `${name} (${g.code})` : name;
                })
                .join(', ')}`,
              fontSize: 10,
              margin: [0, 0, 0, 15] as [number, number, number, number],
            },
          ]
        : [{ text: '', margin: [0, 0, 0, 15] as [number, number, number, number] }]),
      {
        table: {
          headerRows: 1,
          widths: [30, 'auto', 'auto', 15, 'auto', 'auto'],
          body: tableBody,
        },
        layout: {
          fillColor: (rowIndex: number) => (rowIndex === 0 ? '#f5f5f5' : null),
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#cccccc',
          vLineColor: () => '#cccccc',
        },
      },
      {
        text: '\n\nLegende:',
        fontSize: 10,
        bold: true,
        margin: [0, 20, 0, 5],
      },
      {
        columns: [
          {
            width: 'auto',
            stack: [
              {
                canvas: [
                  {
                    type: 'rect',
                    x: 0,
                    y: 0,
                    w: 15,
                    h: 15,
                    color: '#e8f5e9',
                  },
                ],
              },
            ],
          },
          { text: ' Besetzt', width: 80, fontSize: 9, margin: [5, 2, 0, 0] },
          {
            width: 'auto',
            stack: [
              {
                canvas: [
                  {
                    type: 'rect',
                    x: 0,
                    y: 0,
                    w: 15,
                    h: 15,
                    color: '#ffffff',
                    lineColor: '#cccccc',
                  },
                ],
              },
            ],
          },
          { text: ' Frei', width: 80, fontSize: 9, margin: [5, 2, 0, 0] },
          {
            width: 'auto',
            stack: [
              {
                canvas: [
                  {
                    type: 'rect',
                    x: 0,
                    y: 0,
                    w: 15,
                    h: 15,
                    color: '#ffebee',
                  },
                ],
              },
            ],
          },
          { text: ' Blockiert', width: 80, fontSize: 9, margin: [5, 2, 0, 0] },
          {
            width: 'auto',
            stack: [
              {
                canvas: [
                  {
                    type: 'rect',
                    x: 0,
                    y: 0,
                    w: 15,
                    h: 15,
                    color: '#ede9fe',
                  },
                ],
              },
            ],
          },
          { text: ' Reiseleiter', width: 80, fontSize: 9, margin: [5, 2, 0, 0] },
        ],
      },
    ],
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
      subheader: {
        fontSize: 12,
      },
      title: {
        fontSize: 16,
        bold: true,
      },
      tableHeader: {
        bold: true,
        fontSize: 10,
        fillColor: '#f5f5f5',
      },
      rowNumber: {
        fontSize: 9,
        bold: true,
      },
    },
  };

  const pdf = await pdfMake.createPdf(docDefinition);
  pdf.download(`Sitzplan_${data.trip.text.replace(/\s+/g, '_')}.pdf`);
}
