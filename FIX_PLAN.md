# FleetManager Fix Plan
**Date:** 2026-02-09
**Priority:** High → Low

---

## Overview

This document outlines the implementation plan to address the 4 identified issues from the test suite. All issues are relatively straightforward as the backend/database support already exists.

**Total Issues:** 4
- High Priority: 2
- Medium Priority: 2

**Estimated Total Effort:** 8-12 hours

---

## ISSUE #1: Multiple Departures UI Missing

**Priority:** HIGH
**Complexity:** Medium
**Estimated Effort:** 3-4 hours
**Test Cases:** TC-A2.1, TC-A2.2

### Problem Description
Users can only view/edit the first departure of a trip. There's no UI to:
- View all departures for a trip
- Add new departures
- Edit/delete existing departures
- Switch between departures in the editing mask

### Current State
- ✅ Database schema supports multiple departures (`trip_departures` table)
- ✅ `handleAddDeparture` function exists in TripDataTab.tsx (lines 54-61)
- ✅ Backend hooks support CRUD operations
- ❌ No UI button to add departures
- ❌ Only displays first departure: `const currentDeparture = departures[0];`

### Solution Design

#### 1. Add Departure Selector Component
Create a new component to display and manage departures:

**File:** `src/components/TripEditingMask/DepartureSelector.tsx`

```typescript
interface DepartureSelectorProps {
  departures: TripDeparture[];
  selectedDeparture: TripDeparture | null;
  onSelectDeparture: (departure: TripDeparture) => void;
  onAddDeparture: () => void;
  onDeleteDeparture: (id: string) => void;
}

// Features:
// - Dropdown or tab interface showing all departures
// - Display: code, start_date - end_date
// - "Add Departure" button
// - Delete icon per departure (with confirmation)
// - Visual indicator for active departure
```

#### 2. Update TripDataTab Component

**File:** `src/components/TripEditingMask/TripDataTab.tsx`

Changes needed:
- Replace `const currentDeparture = departures[0];` with state-based selection
- Add `useState` for `selectedDeparture`
- Wire up `handleAddDeparture` to UI button
- Add `handleDeleteDeparture` function
- Import and render `DepartureSelector` component
- Update all references to `currentDeparture` to use `selectedDeparture`

#### 3. Update Translation Files

**Files:** `public/locales/de/trips.json`, `public/locales/en/trips.json`

Add keys:
```json
{
  "departures": {
    "title": "Termine",
    "selectDeparture": "Termin wählen",
    "addDeparture": "Termin hinzufügen",
    "deleteDeparture": "Termin löschen",
    "confirmDelete": "Sind Sie sicher, dass Sie diesen Termin löschen möchten?",
    "noDepartures": "Keine Termine vorhanden",
    "dateRange": "{{start}} - {{end}}"
  }
}
```

### Implementation Steps

1. ✅ Create `DepartureSelector.tsx` component
   - Dropdown UI with departure list
   - Add button with Plus icon
   - Delete button with confirmation dialog
   - Visual active state for selected departure

2. ✅ Update `TripDataTab.tsx`
   - Add state: `const [selectedDepartureId, setSelectedDepartureId] = useState<string | null>(null);`
   - Derive selected departure from state
   - Connect `handleAddDeparture` to button
   - Add `handleDeleteDeparture` with cascade warning
   - Render `DepartureSelector` at top of tab

3. ✅ Update `useTrips.ts` hook if needed
   - Verify `createDeparture` function exists
   - Verify `deleteDeparture` function exists
   - Add if missing

4. ✅ Add translations (DE/EN)

5. ✅ Test scenarios:
   - Add second departure to existing trip
   - Switch between departures
   - Edit data in each departure
   - Delete departure (verify cascade)
   - Create trip with multiple departures from scratch

### Acceptance Criteria

- [ ] Can view all departures for a trip
- [ ] Can add new departures via UI button
- [ ] Can switch between departures
- [ ] Editing data updates the correct departure
- [ ] Can delete departures with confirmation
- [ ] Tour guides, transport groups scoped to selected departure
- [ ] No console errors

---

## ISSUE #4: Accommodation Filters Not Implemented

**Priority:** HIGH
**Complexity:** Low
**Estimated Effort:** 2-3 hours
**Test Case:** TC-E5.1

### Problem Description
With 34+ accommodations (e.g., Rhone trip), users need filters to narrow the list. Translation keys exist but UI components are missing.

### Current State
- ✅ Translation keys defined for filters (lines 81-86 in accommodations.json)
- ✅ Structured view with deck grouping (reduces clutter)
- ❌ No search/filter UI
- ❌ Cannot filter by status (Frei/Anfrage)
- ❌ Cannot filter by room type or price range

### Solution Design

#### 1. Add Filter Bar Component

**File:** `src/components/AccommodationTab/AccommodationFilters.tsx`

```typescript
interface AccommodationFiltersProps {
  onFilterChange: (filters: AccommodationFilters) => void;
  deckNames: string[];
}

interface AccommodationFilters {
  searchText: string;
  status: 'all' | 'Frei' | 'Anfrage';
  deck: string | 'all';
  priceMin: number | null;
  priceMax: number | null;
}

// UI Elements:
// - Search input (filter by name/code)
// - Status dropdown (All, Frei, Anfrage)
// - Deck dropdown (All, Smaragddeck, Rubindeck, etc.)
// - Price range inputs (min/max)
// - Clear filters button
```

#### 2. Update AccommodationTab Component

**File:** `src/components/AccommodationTab/AccommodationTab.tsx`

Changes:
- Add state for filters: `const [filters, setFilters] = useState<AccommodationFilters>({...})`
- Add `useMemo` to compute filtered accommodations
- Render `AccommodationFilters` component at top
- Pass filtered accommodations to `StructuredView` and `FlatListView`
- Show active filter count badge

#### 3. Filtering Logic

```typescript
const filteredAccommodations = useMemo(() => {
  return accommodations.filter(acc => {
    // Search text filter
    if (filters.searchText && !acc.name.toLowerCase().includes(filters.searchText.toLowerCase())
        && !acc.code?.toLowerCase().includes(filters.searchText.toLowerCase())) {
      return false;
    }

    // Status filter
    if (filters.status !== 'all' && acc.status !== filters.status) {
      return false;
    }

    // Deck filter
    if (filters.deck !== 'all' && acc.deck_name !== filters.deck) {
      return false;
    }

    // Price range filter
    if (filters.priceMin !== null && acc.price < filters.priceMin) {
      return false;
    }
    if (filters.priceMax !== null && acc.price > filters.priceMax) {
      return false;
    }

    return true;
  });
}, [accommodations, filters]);
```

### Implementation Steps

1. ✅ Create `AccommodationFilters.tsx` component
   - Search input with magnifying glass icon
   - Status dropdown with badges
   - Deck dropdown
   - Price range inputs (two number fields)
   - Clear all button

2. ✅ Update `AccommodationTab.tsx`
   - Add filter state
   - Add filtering logic (useMemo)
   - Render filter bar
   - Show "X filters active" badge
   - Pass filtered data to views

3. ✅ Update translations if needed

4. ✅ Test scenarios:
   - Search by accommodation name
   - Filter by status (Frei only)
   - Filter by deck (Rubindeck only)
   - Filter by price range (€1000-€2000)
   - Combine multiple filters
   - Clear all filters
   - Empty state when no matches

### Acceptance Criteria

- [ ] Search filters accommodations by name/code
- [ ] Status filter shows only selected status
- [ ] Deck filter shows only selected deck
- [ ] Price range filter works correctly
- [ ] Multiple filters combine with AND logic
- [ ] Clear filters button resets all
- [ ] Active filter count shown
- [ ] Empty state when no results

---

## ISSUE #3: PKW Negative Pricing Not Enforced

**Priority:** MEDIUM
**Complexity:** Low
**Estimated Effort:** 2-3 hours
**Test Case:** TC-B4.1

### Problem Description
PKW (own arrival/departure) transports should have negative prices to represent cost reduction, but there's no validation or UI support.

### Current State
- ✅ PKW type (`unterart: 'PKW'`) fully supported
- ✅ PKW transports hide boarding points and seat maps
- ❌ Price field not shown in transport edit form
- ❌ No validation for negative pricing
- ❌ No business rule enforcement

### Solution Design

#### 1. Add Price Field to Transport Edit Form

**File:** `src/components/TripEditingMask/TransportTab.tsx`

Add price field to edit mode (around line 269-280):

```typescript
{/* Add after status field */}
<div>
  <label className="block text-sm font-medium text-gray-300 mb-1">
    {t('transports.price')}
  </label>
  <div className="flex items-center gap-2">
    <span className="text-gray-400">€</span>
    <input
      type="number"
      step="0.01"
      value={formData.preis || 0}
      onChange={(e) => setFormData({ ...formData, preis: parseFloat(e.target.value) || 0 })}
      className={`flex-1 px-3 py-2 bg-gray-600 border rounded text-white ${
        formData.unterart === 'PKW' && formData.preis >= 0 ? 'border-red-500' : 'border-gray-500'
      }`}
    />
  </div>
  {formData.unterart === 'PKW' && formData.preis >= 0 && (
    <p className="text-red-400 text-xs mt-1">
      {t('transports.pkwPriceWarning')}
    </p>
  )}
</div>
```

#### 2. Add Validation in useTrips Hook

**File:** `src/hooks/useTrips.ts`

Update `createBusTransport` and `updateBusTransport`:

```typescript
// In createBusTransport (around line 124)
const createBusTransport = useCallback(async (tripId: string, data: Partial<BusTransport>) => {
  // Validate PKW pricing
  if (data.unterart === 'PKW' && data.preis && data.preis >= 0) {
    console.warn('PKW transports should have negative pricing');
    // Option 1: Throw error (strict)
    // throw new Error('PKW transports must have negative prices');

    // Option 2: Auto-convert (helpful)
    data.preis = -Math.abs(data.preis);
  }

  // ... rest of function
});
```

#### 3. Display Price in View Mode

Show price in transport card when viewing (not editing):

```typescript
<div className="flex items-center gap-2 text-sm">
  <DollarSign className="w-4 h-4 text-gray-400" />
  <span className={transport.unterart === 'PKW' && transport.preis < 0 ? 'text-green-400' : 'text-white'}>
    {transport.preis < 0 ? '-' : ''}€{Math.abs(transport.preis || 0).toFixed(2)}
  </span>
  {transport.unterart === 'PKW' && transport.preis < 0 && (
    <span className="text-xs text-gray-400">({t('transports.costReduction')})</span>
  )}
</div>
```

#### 4. Update Translations

Add keys:
```json
{
  "transports": {
    "price": "Preis",
    "pkwPriceWarning": "PKW-Transporte sollten einen negativen Preis haben (Kostenreduzierung)",
    "costReduction": "Kostenreduzierung"
  }
}
```

### Implementation Steps

1. ✅ Add price field to transport edit form
   - Number input with € symbol
   - Validation styling for PKW >= 0
   - Warning message for incorrect values

2. ✅ Add validation to `useTrips.ts`
   - Check unterart === 'PKW'
   - Enforce negative pricing (auto-convert or error)

3. ✅ Display price in view mode
   - Show in transport card
   - Highlight negative prices for PKW in green
   - Add tooltip/label

4. ✅ Update translations

5. ✅ Test scenarios:
   - Create PKW with positive price → warning/conversion
   - Create PKW with negative price → success
   - Edit PKW price from negative to positive → warning
   - BUS transport allows positive prices normally

### Acceptance Criteria

- [ ] Price field visible in transport edit form
- [ ] PKW transports validate for negative pricing
- [ ] Visual warning when PKW price is positive
- [ ] Prices display correctly in view mode
- [ ] Negative prices highlighted for PKW
- [ ] BUS transports unaffected

---

## ISSUE #5: Age-Based Discount Flags Not Displayed

**Priority:** MEDIUM
**Complexity:** Low
**Estimated Effort:** 1-2 hours
**Test Case:** TC-G4.1

### Problem Description
Database columns `fruehbucher` (early bird eligible) and `altersermaessigung` (age discount eligible) exist but are not displayed or editable in the UI.

### Current State
- ✅ Database columns exist on `bus_transports` table
- ✅ Translation keys exist (extras.json lines 64-65)
- ❌ Not displayed in transport card
- ❌ Not editable in transport form

### Solution Design

#### 1. Add Discount Flags to Transport Card

**File:** `src/components/TripEditingMask/TransportTab.tsx`

Add badges in view mode (around line 227-235):

```typescript
{/* After direction/type badges */}
<div className="flex flex-wrap items-center gap-2 mt-2">
  {transport.fruehbucher && (
    <span className="px-2 py-0.5 bg-blue-900/30 border border-blue-700 rounded text-blue-300 text-xs flex items-center gap-1">
      <Clock className="w-3 h-3" />
      {t('extras:fruehbucher')}
    </span>
  )}
  {transport.altersermaessigung && (
    <span className="px-2 py-0.5 bg-purple-900/30 border border-purple-700 rounded text-purple-300 text-xs flex items-center gap-1">
      <Users className="w-3 h-3" />
      {t('extras:altersermaessigung')}
    </span>
  )}
</div>
```

#### 2. Add Checkboxes to Edit Form

Add to edit form (around line 280-290):

```typescript
<div className="col-span-2">
  <label className="block text-sm font-medium text-gray-300 mb-2">
    {t('transports.discountEligibility')}
  </label>
  <div className="flex gap-4">
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={formData.fruehbucher || false}
        onChange={(e) => setFormData({ ...formData, fruehbucher: e.target.checked })}
        className="w-4 h-4 rounded border-gray-500 text-teal-600"
      />
      <span className="text-sm text-gray-300">{t('extras:fruehbucher')}</span>
    </label>
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={formData.altersermaessigung || false}
        onChange={(e) => setFormData({ ...formData, altersermaessigung: e.target.checked })}
        className="w-4 h-4 rounded border-gray-500 text-teal-600"
      />
      <span className="text-sm text-gray-300">{t('extras:altersermaessigung')}</span>
    </label>
  </div>
</div>
```

#### 3. Update TypeScript Types

**File:** `src/types/trip.ts`

Verify `BusTransport` interface includes:
```typescript
export interface BusTransport {
  // ... existing fields
  fruehbucher?: boolean;
  altersermaessigung?: boolean;
}
```

#### 4. Update Translations

Add key:
```json
{
  "transports": {
    "discountEligibility": "Rabatt-Berechtigung"
  }
}
```

### Implementation Steps

1. ✅ Add flags to `BusTransport` TypeScript interface

2. ✅ Add badges to transport card view mode
   - Early bird badge (blue)
   - Age discount badge (purple)
   - Icons (Clock, Users)

3. ✅ Add checkboxes to edit form
   - Section: "Rabatt-Berechtigung"
   - Two checkboxes side by side

4. ✅ Update `useTrips.ts` if needed
   - Ensure fields are included in create/update operations

5. ✅ Update translations

6. ✅ Test scenarios:
   - Enable fruehbucher flag → badge shows in view mode
   - Enable altersermaessigung flag → badge shows
   - Edit existing transport to add flags
   - Verify flags persist after save

### Acceptance Criteria

- [ ] Discount flags visible as badges in view mode
- [ ] Checkboxes available in edit mode
- [ ] Flags save correctly to database
- [ ] Badges use distinct colors (blue for early bird, purple for age)
- [ ] Icons enhance visual clarity

---

## Implementation Order

### Phase 1: High Priority (Week 1)
1. **Day 1-2:** ISSUE #1 - Multiple Departures UI (3-4 hours)
2. **Day 3:** ISSUE #4 - Accommodation Filters (2-3 hours)

### Phase 2: Medium Priority (Week 2)
3. **Day 1:** ISSUE #3 - PKW Negative Pricing (2-3 hours)
4. **Day 2:** ISSUE #5 - Discount Flags Display (1-2 hours)

### Phase 3: Testing & QA (Week 2-3)
- Comprehensive regression testing
- Cross-browser testing
- User acceptance testing with seed data

---

## Testing Checklist

After implementing all fixes, verify:

### ISSUE #1 Testing
- [ ] Can add multiple departures to a trip
- [ ] Can switch between departures in editing mask
- [ ] Tour guide assignments are per-departure
- [ ] Transport groups are per-departure
- [ ] Deleting departure cascades correctly
- [ ] No console errors

### ISSUE #4 Testing
- [ ] Search works across name and code
- [ ] Status filter narrows to selected status
- [ ] Deck filter narrows to selected deck
- [ ] Price range filter works
- [ ] Combined filters work (AND logic)
- [ ] Clear filters resets all
- [ ] Empty state displays correctly

### ISSUE #3 Testing
- [ ] PKW price field shows in edit form
- [ ] PKW with positive price shows warning
- [ ] PKW with negative price saves correctly
- [ ] Price displays correctly in view mode
- [ ] BUS transports allow positive prices
- [ ] Auto-conversion works (if implemented)

### ISSUE #5 Testing
- [ ] Discount badges show in view mode
- [ ] Checkboxes available in edit mode
- [ ] Flags persist after save
- [ ] Visual styling is clear

---

## Success Metrics

**Target:** 100% test case pass rate (78/78)

**Current:** 92% (72/78)

**After fixes:** Expected 100%

---

## Notes for Implementation

1. **Code Style:** Follow existing patterns in the codebase
   - Use TypeScript interfaces for all props
   - Use `useCallback` for event handlers
   - Use `useMemo` for computed values
   - Follow Tailwind CSS conventions

2. **Translations:** Always add both DE and EN translations

3. **Error Handling:** Add try-catch blocks and user-friendly error messages

4. **Accessibility:** Include proper ARIA labels and keyboard navigation

5. **Testing:** Test with seed data (3 trips with varying complexity)

---

**Document Version:** 1.0
**Last Updated:** 2026-02-09
**Status:** Ready for Implementation
