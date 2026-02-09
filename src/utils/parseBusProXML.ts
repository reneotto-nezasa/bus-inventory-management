import { supabase } from '../lib/supabase';

export interface ParsedBusProData {
  trips: any[];
  departures: any[];
  transports: any[];
  accommodations: any[];
  compositeAccommodations: any[];
  extras: any[];
  boardingPointAssignments: any[];
  earlyBirdDiscounts: any[];
  unresolvedBoardingPoints: Set<string>;
  unresolvedHotels: Set<string>;
}

export interface ImportReport {
  success: boolean;
  counts: {
    trips: number;
    departures: number;
    transports: number;
    accommodations: number;
    extras: number;
    boardingPoints: number;
    earlyBirdDiscounts: number;
  };
  warnings: string[];
  errors: string[];
  unresolvedReferences: {
    boardingPoints: string[];
    hotels: string[];
  };
}

function parseXMLString(xmlString: string): Document {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

  const parseError = xmlDoc.querySelector('parsererror');
  if (parseError) {
    throw new Error('XML parsing failed: ' + parseError.textContent);
  }

  return xmlDoc;
}

function getElementText(element: Element | null, tagName: string): string {
  if (!element) return '';
  const child = element.querySelector(tagName);
  return child?.textContent?.trim() || '';
}

function getElementAttribute(element: Element | null, tagName: string, attribute: string): string {
  if (!element) return '';
  const child = element.querySelector(tagName);
  return child?.getAttribute(attribute) || '';
}

function parseCompositeHotelIds(compositeId: string): string[] {
  const matches = compositeId.match(/#([^#]+)#/g);
  if (!matches) return [];
  return matches.map(m => m.replace(/#/g, ''));
}

export function parseBusProXML(xmlString: string): ParsedBusProData {
  const xmlDoc = parseXMLString(xmlString);

  const result: ParsedBusProData = {
    trips: [],
    departures: [],
    transports: [],
    accommodations: [],
    compositeAccommodations: [],
    extras: [],
    boardingPointAssignments: [],
    earlyBirdDiscounts: [],
    unresolvedBoardingPoints: new Set(),
    unresolvedHotels: new Set(),
  };

  const reisen = xmlDoc.querySelectorAll('reise');

  reisen.forEach((reise) => {
    const tripCode = getElementText(reise, 'code');
    const tripText = getElementText(reise, 'text');
    const startDate = getElementText(reise, 'start_date');
    const endDate = getElementText(reise, 'end_date');
    const basePrice = parseFloat(getElementText(reise, 'grundpreis')) || 0;
    const bookingDeadline = getElementText(reise, 'booking_deadline');

    const trip = {
      code: tripCode,
      text: tripText,
      start_date: startDate,
      end_date: endDate,
      base_price: basePrice,
      booking_deadline: bookingDeadline,
      status_outbound: getElementText(reise, 'status_hin') || 'Offen',
      status_return: getElementText(reise, 'status_rueck') || 'Offen',
    };
    result.trips.push(trip);

    const termine = reise.querySelectorAll('termin');
    termine.forEach((termin) => {
      const terminCode = getElementText(termin, 'termin_code');
      const terminDate = getElementText(termin, 'termin_datum');

      const departure = {
        tripCode,
        termin: terminDate,
        termin_code: terminCode,
      };
      result.departures.push(departure);

      const befoerderungen = termin.querySelectorAll('lei_befoerderung');
      befoerderungen.forEach((bef) => {
        const transport = {
          tripCode,
          terminCode,
          type: getElementText(bef, 'unterart') || 'BUS',
          direction: getElementText(bef, 'richtung') || 'HIN',
          text: getElementText(bef, 'text'),
          termin: getElementText(bef, 'termin'),
          bis: getElementText(bef, 'bis'),
          status: getElementText(bef, 'status') || 'Offen',
          gruppe: getElementText(bef, 'gruppe') || 'Busreise',
          bus_type_name: getElementText(bef, 'bustyp_name'),
          hinweis_stamm: getElementText(bef, 'hinweis_stamm'),
          tour_guide_name: getElementText(bef, 'reiseleiter_name'),
          tour_guide_phone: getElementText(bef, 'reiseleiter_telefon'),
        };
        result.transports.push(transport);

        const zustiege = bef.querySelectorAll('leistung_zustieg');
        zustiege.forEach((zustieg) => {
          const boardingPointId = getElementText(zustieg, 'zustieg_ref');
          const surcharge = parseFloat(getElementAttribute(zustieg, 'preis', 'aufpreis')) || 0;

          result.boardingPointAssignments.push({
            transportRef: transport,
            boardingPointId,
            surcharge,
          });

          if (boardingPointId) {
            result.unresolvedBoardingPoints.add(boardingPointId);
          }
        });
      });

      const unterbringungen = termin.querySelectorAll('lei_unterbringung');
      unterbringungen.forEach((unter) => {
        const hotelRef = getElementText(unter, 'hotel_ref');
        const isComposite = hotelRef.includes('#');

        if (isComposite) {
          const hotelIds = parseCompositeHotelIds(hotelRef);
          const accommodation = {
            tripCode,
            terminCode,
            accommodation_type: getElementText(unter, 'type'),
            room_type: getElementText(unter, 'zimmertyp'),
            date_from: getElementText(unter, 'datum_von'),
            date_to: getElementText(unter, 'datum_bis'),
            nights: parseInt(getElementText(unter, 'naechte')) || 1,
            price: parseFloat(getElementText(unter, 'preis')) || 0,
            notes: getElementText(unter, 'hinweise'),
            hotelIds,
          };
          result.compositeAccommodations.push(accommodation);
          hotelIds.forEach(id => result.unresolvedHotels.add(id));
        } else {
          const accommodation = {
            tripCode,
            terminCode,
            hotelRef,
            accommodation_type: getElementText(unter, 'type'),
            room_type: getElementText(unter, 'zimmertyp'),
            date_from: getElementText(unter, 'datum_von'),
            date_to: getElementText(unter, 'datum_bis'),
            nights: parseInt(getElementText(unter, 'naechte')) || 1,
            price: parseFloat(getElementText(unter, 'preis')) || 0,
            notes: getElementText(unter, 'hinweise'),
          };
          result.accommodations.push(accommodation);
          if (hotelRef) {
            result.unresolvedHotels.add(hotelRef);
          }
        }
      });

      const sonstiges = termin.querySelectorAll('lei_sonstiges');
      sonstiges.forEach((sonst) => {
        const type = getElementText(sonst, 'type');
        let category = 'other';
        if (type === 'EIN') category = 'excursion';
        else if (type === 'VER') category = 'dining';

        const extra = {
          tripCode,
          terminCode,
          category,
          title: getElementText(sonst, 'titel'),
          description: getElementText(sonst, 'beschreibung'),
          price: parseFloat(getElementText(sonst, 'preis')) || 0,
          date: getElementText(sonst, 'datum'),
          is_mandatory: getElementText(sonst, 'pflicht') === 'true',
        };
        result.extras.push(extra);
      });

      const fruehbucher = termin.querySelectorAll('fruehbucher');
      fruehbucher.forEach((fb) => {
        const discount = {
          tripCode,
          terminCode,
          deadline_date: getElementText(fb, 'deadline'),
          discount_amount: parseFloat(getElementText(fb, 'rabatt')) || 0,
          discount_percent: parseFloat(getElementText(fb, 'rabatt_prozent')) || 0,
          min_participants: parseInt(getElementText(fb, 'min_teilnehmer')) || null,
        };
        result.earlyBirdDiscounts.push(discount);
      });
    });
  });

  return result;
}

export async function importBusProData(data: ParsedBusProData): Promise<ImportReport> {
  const report: ImportReport = {
    success: false,
    counts: {
      trips: 0,
      departures: 0,
      transports: 0,
      accommodations: 0,
      extras: 0,
      boardingPoints: 0,
      earlyBirdDiscounts: 0,
    },
    warnings: [],
    errors: [],
    unresolvedReferences: {
      boardingPoints: Array.from(data.unresolvedBoardingPoints),
      hotels: Array.from(data.unresolvedHotels),
    },
  };

  try {
    for (const trip of data.trips) {
      const { error: tripError } = await supabase
        .from('trips')
        .upsert(trip, { onConflict: 'code' });

      if (tripError) {
        report.errors.push(`Trip ${trip.code}: ${tripError.message}`);
      } else {
        report.counts.trips++;
      }
    }

    const tripMap = new Map<string, string>();
    for (const trip of data.trips) {
      const { data: tripData } = await supabase
        .from('trips')
        .select('id, code')
        .eq('code', trip.code)
        .single();
      if (tripData) {
        tripMap.set(tripData.code, tripData.id);
      }
    }

    for (const departure of data.departures) {
      const tripId = tripMap.get(departure.tripCode);
      if (!tripId) {
        report.warnings.push(`Departure ${departure.termin_code}: Trip not found`);
        continue;
      }

      const { error: depError } = await supabase
        .from('trip_departures')
        .upsert(
          {
            trip_id: tripId,
            termin: departure.termin,
            termin_code: departure.termin_code,
          },
          { onConflict: 'trip_id,termin' }
        );

      if (depError) {
        report.errors.push(`Departure ${departure.termin_code}: ${depError.message}`);
      } else {
        report.counts.departures++;
      }
    }

    const departureMap = new Map<string, string>();
    for (const departure of data.departures) {
      const tripId = tripMap.get(departure.tripCode);
      if (!tripId) continue;

      const { data: depData } = await supabase
        .from('trip_departures')
        .select('id, termin_code')
        .eq('trip_id', tripId)
        .eq('termin', departure.termin)
        .single();

      if (depData) {
        departureMap.set(`${departure.tripCode}_${departure.terminCode}`, depData.id);
      }
    }

    for (const transport of data.transports) {
      const departureId = departureMap.get(`${transport.tripCode}_${transport.terminCode}`);
      if (!departureId) {
        report.warnings.push(`Transport: Departure not found for ${transport.terminCode}`);
        continue;
      }

      const { error: transError } = await supabase
        .from('bus_transports')
        .insert({
          trip_departure_id: departureId,
          unterart: transport.type,
          richtung: transport.direction,
          text: transport.text,
          termin: transport.termin,
          bis: transport.bis,
          status: transport.status,
          gruppe: transport.gruppe,
          preis: 0,
          bus_type_name: transport.bus_type_name,
          hinweis_stamm: transport.hinweis_stamm,
          tour_guide_name: transport.tour_guide_name,
          tour_guide_phone: transport.tour_guide_phone,
        });

      if (transError) {
        report.errors.push(`Transport: ${transError.message}`);
      } else {
        report.counts.transports++;
      }
    }

    for (const bpRef of data.unresolvedBoardingPoints) {
      const { data: existing } = await supabase
        .from('boarding_points')
        .select('id')
        .eq('idbuspro', bpRef)
        .single();

      if (!existing) {
        await supabase.from('boarding_points').insert({
          idbuspro: bpRef,
          city: `Placeholder ${bpRef}`,
          plz: '00000',
          address: 'Needs enrichment',
          time: '00:00',
          needs_enrichment: true,
        });
        report.counts.boardingPoints++;
      }
    }

    for (const hotelRef of data.unresolvedHotels) {
      const { data: existing } = await supabase
        .from('hotel_partners')
        .select('id')
        .eq('idbuspro_partner_hotel', hotelRef)
        .single();

      if (!existing) {
        await supabase.from('hotel_partners').insert({
          idbuspro_partner_hotel: hotelRef,
          name: `Placeholder Hotel ${hotelRef}`,
          city: 'Unknown',
          needs_enrichment: true,
        });
      }
    }

    for (const extra of data.extras) {
      const departureId = departureMap.get(`${extra.tripCode}_${extra.terminCode}`);
      if (!departureId) continue;

      const { error: extraError } = await supabase
        .from('trip_extras')
        .insert({
          trip_departure_id: departureId,
          category: extra.category,
          title: extra.title,
          description: extra.description,
          price: extra.price,
          date: extra.date,
          is_mandatory: extra.is_mandatory,
        });

      if (!extraError) {
        report.counts.extras++;
      }
    }

    for (const discount of data.earlyBirdDiscounts) {
      const departureId = departureMap.get(`${discount.tripCode}_${discount.terminCode}`);
      if (!departureId) continue;

      const { error: discountError } = await supabase
        .from('early_bird_discounts')
        .insert({
          trip_departure_id: departureId,
          deadline_date: discount.deadline_date,
          discount_amount: discount.discount_amount,
          discount_percent: discount.discount_percent,
          min_participants: discount.min_participants,
        });

      if (!discountError) {
        report.counts.earlyBirdDiscounts++;
      }
    }

    report.success = report.errors.length === 0;
  } catch (error: any) {
    report.success = false;
    report.errors.push(error.message);
  }

  return report;
}
