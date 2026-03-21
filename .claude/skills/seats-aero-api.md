# Seats.aero Partner API Reference

Use this skill when working with the Seats.aero award flight search API in this project.

## Overview

The Seats.aero Partner API provides award flight availability data across multiple airline loyalty programs. The app integrates with it via `src/services/seatsAero.js`.

## Authentication

All requests require the `Partner-Authorization` header with the API key stored in `VITE_SEATS_AERO_API_KEY` (`.env` file).

```
Partner-Authorization: <api_key>
```

Daily rate limits apply. The response header indicates remaining API calls for the day.

## Base URL

```
https://seats.aero/partnerapi
```

- **Dev mode**: Vite proxies `/partnerapi` → `https://seats.aero` (configured in `vite.config.js`)
- **Production**: Routes through `corsproxy.io` for CORS

## Endpoints

### 1. Cached Search — `GET /search`

Search award flight availability for a specific route.

**Service function**: `cachedSearch()` in `src/services/seatsAero.js`

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `origin_airport` | string | Yes | 3-letter IATA airport code (e.g., `SFO`). Supports comma-separated for multiple origins: `SFO,LAX` |
| `destination_airport` | string | Yes | 3-letter IATA airport code (e.g., `NRT`). Supports comma-separated |
| `cabin` | string | No | Cabin class: `economy`, `business`, `first` |
| `start_date` | string | No | Start of date range (`YYYY-MM-DD`) |
| `end_date` | string | No | End of date range (`YYYY-MM-DD`) |
| `source` | string | No | Mileage program filter (see Sources below) |
| `cursor` | int | No | Pagination cursor from previous response |
| `take` | int | No | Number of results to return (default 50, max 500) |
| `skip` | int | No | Number of results to skip |
| `order_by` | string | No | Sort order (e.g., `price`) |
| `include_trips` | bool | No | Include trip-level detail inline |
| `only_direct_flights` | bool | No | Filter to non-stop flights only |
| `carriers` | string | No | Filter by operating carrier |

#### Response

```json
{
  "data": [
    {
      "ID": "string",
      "RouteID": "string",
      "Route": {
        "ID": "string",
        "OriginAirport": "SFO",
        "OriginRegion": "North America",
        "DestinationAirport": "NRT",
        "DestinationRegion": "Asia",
        "Source": "alaska",
        "NumDaysOut": 45,
        "Distance": 5150
      },
      "Date": "2026-04-09",
      "ParsedDate": "2026-04-09T00:00:00Z",
      "YAvailable": true,
      "YMileageCost": "70000",
      "YRemainingSeats": 9,
      "YTotalTaxes": 5600,
      "YAirlines": "JL",
      "WAvailable": false,
      "WMileageCost": "",
      "WRemainingSeats": 0,
      "JAvailable": false,
      "JMileageCost": "",
      "JRemainingSeats": 0,
      "FAvailable": false,
      "FMileageCost": "",
      "FRemainingSeats": 0,
      "TaxesCurrency": "USD",
      "Source": "alaska",
      "AvailabilityTrips": "string (may be empty)",
      "CreatedAt": "2026-03-20T10:00:00Z",
      "UpdatedAt": "2026-03-20T10:00:00Z"
    }
  ],
  "count": 329,
  "hasMore": true,
  "cursor": 12345
}
```

**Cabin field prefixes**: `Y` = Economy, `W` = Premium Economy, `J` = Business, `F` = First

Each cabin has: `Available` (bool), `MileageCost` (string), `MileageCostRaw` (int), `RemainingSeats` (int), `TotalTaxes` (int), `Airlines` (string)

### 2. Get Trips — `GET /trips/{availabilityId}`

Get flight-level details (segments, booking links) for a specific availability result.

**Service function**: `getTrips()` in `src/services/seatsAero.js`

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `availabilityId` | string | Yes | The `ID` from a cached search result |

#### Response

```json
{
  "data": [
    {
      "ID": "string",
      "RouteID": "string",
      "AvailabilityID": "string",
      "Carriers": "JL",
      "Cabin": "economy",
      "DepartsAt": "2026-04-09T10:30:00Z",
      "ArrivesAt": "2026-04-10T14:00:00Z",
      "MileageCost": 70000,
      "AllianceCost": 0,
      "TotalTaxes": 5600,
      "TaxesCurrency": "USD",
      "TaxesCurrencySymbol": "$",
      "TotalDuration": 660,
      "Stops": 0,
      "RemainingSeats": 9,
      "TotalSegmentDistance": 5150,
      "FlightNumbers": "JL1",
      "Source": "alaska",
      "Filtered": false,
      "AvailabilitySegments": [
        {
          "ID": "string",
          "RouteID": "string",
          "AvailabilityID": "string",
          "AvailabilityTripID": "string",
          "FlightNumber": "JL1",
          "Distance": 5150,
          "FareClass": "Y",
          "Cabin": "economy",
          "AircraftName": "Boeing 787-9",
          "AircraftCode": "789",
          "OriginAirport": "SFO",
          "DestinationAirport": "NRT",
          "DepartsAt": "2026-04-09T10:30:00Z",
          "ArrivesAt": "2026-04-10T14:00:00Z",
          "Source": "alaska",
          "Order": 0
        }
      ]
    }
  ],
  "OriginCoordinates": { "Lat": 37.6213, "Lon": -122.379 },
  "DestinationCoordinates": { "Lat": 35.7647, "Lon": 140.3864 },
  "BookingLinks": [
    {
      "Label": "Book on Alaska Airlines",
      "Link": "https://www.alaskaair.com/...",
      "Primary": true
    }
  ],
  "RevalidationID": "string"
}
```

### 3. Bulk Availability — `GET /availability`

Search availability across regions/programs without specifying a route.

**Not yet implemented in the app**, but available in the API.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `source` | string | Yes | Mileage program (e.g., `united`) |
| `cabin` | string | No | Cabin class |
| `start_date` | string | No | Start date (`YYYY-MM-DD`) |
| `end_date` | string | No | End date (`YYYY-MM-DD`) |
| `origin_region` | string | No | Origin region filter |
| `destination_region` | string | No | Destination region filter |
| `cursor` | int | No | Pagination cursor |
| `take` | int | No | Results per page |
| `skip` | int | No | Skip N results |

### 4. Get Routes — `GET /routes`

Get all monitored routes for a given loyalty program.

**Not yet implemented in the app**, but available in the API.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `source` | string | Yes | Mileage program (e.g., `united`) |

## Supported Mileage Programs (Sources)

```
aeroplan, alaska, american, aeromexico, azul, copa, delta, emirates,
ethiopian, etihad, eurobonus, finnair, flyingblue, gol, jetblue,
lufthansa, qantas, qatar, sas, saudia, singapore, turkish, united,
velocity, virginatlantic, virginaustralia
```

## Implementation Notes

### Current Service (`src/services/seatsAero.js`)

- `cachedSearch({ origin, destination, cabin, startDate, endDate, source, cursor })` — calls `/search`
- `getTrips(id)` — calls `/trips/{id}`
- `isApiKeyConfigured()` — validates API key is set
- `CABIN_OPTIONS` — array of `{ value, label }` for UI selects
- `SOURCES` — array of supported program strings

### UI Component (`src/components/AwardSearch.jsx`)

- Search form with origin/destination/cabin/program/dates
- Results display with clickable cards that expand to show trip details
- `getCabinAvailability(row)` extracts available cabins from a result row
- `handleViewTrips(id)` lazy-loads trip details on card click
- Pagination via "Load More" button using cursor

### Adding New Features

When adding new API features:
1. Add the service function in `src/services/seatsAero.js` using `apiRequest(endpoint, params)`
2. The `buildUrl()` helper handles dev proxy vs production CORS proxy routing
3. Response fields use **PascalCase** (e.g., `BookingLinks`, `AvailabilitySegments`)
4. Always handle both PascalCase and snake_case response fields for robustness
5. Add new sources to the `SOURCES` array if the API adds new programs
