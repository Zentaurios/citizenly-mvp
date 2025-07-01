import { AddressValidationResult, GeographicData } from '../database/types'

interface GoogleMapsResponse {
  results: {
    formatted_address: string
    geometry: {
      location: {
        lat: number
        lng: number
      }
    }
    address_components: {
      long_name: string
      short_name: string
      types: string[]
    }[]
  }[]
  status: string
}

interface CongressionalDistrictResponse {
  result: {
    districtNumber: number
    stateName: string
  }
}

class GeographicVerification {
  private apiKey: string

  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY || ''
  }

  async validateAndGeocodeAddress(
    street: string,
    city: string,
    state: string,
    zipCode: string
  ): Promise<AddressValidationResult> {
    try {
      if (!this.apiKey) {
        console.warn('Google Maps API key not configured, using mock validation')
        return this.mockAddressValidation(street, city, state, zipCode)
      }

      const address = `${street}, ${city}, ${state} ${zipCode}`
      const encodedAddress = encodeURIComponent(address)
      
      // Geocode the address
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${this.apiKey}`
      
      const response = await fetch(geocodeUrl)
      const data: GoogleMapsResponse = await response.json()

      if (data.status !== 'OK' || !data.results.length) {
        return {
          isValid: false,
          errorMessage: 'Address could not be validated or found'
        }
      }

      const result = data.results[0]
      const location = result.geometry.location

      // Extract geographic components
      const addressComponents = result.address_components
      const county = this.extractComponent(addressComponents, 'administrative_area_level_2')
      const validatedState = this.extractComponent(addressComponents, 'administrative_area_level_1')

      // Verify state matches
      if (validatedState !== state.toUpperCase()) {
        return {
          isValid: false,
          errorMessage: 'State does not match the provided address'
        }
      }

      // Get congressional district
      const congressionalDistrict = await this.getCongressionalDistrict(location.lat, location.lng)
      
      return {
        isValid: true,
        coordinates: {
          latitude: location.lat,
          longitude: location.lng,
          congressionalDistrict: congressionalDistrict?.toString(),
          county: county?.replace(' County', ''),
          timezone: await this.getTimezone(location.lat, location.lng)
        },
        formattedAddress: result.formatted_address,
        congressionalDistrict: congressionalDistrict?.toString(),
        county: county?.replace(' County', '')
      }

    } catch (error) {
      console.error('Address validation error:', error)
      return {
        isValid: false,
        errorMessage: 'Address validation service is temporarily unavailable'
      }
    }
  }

  private async getCongressionalDistrict(latitude: number, longitude: number): Promise<number | undefined> {
    try {
      // Use a free congressional district API
      const response = await fetch(
        `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${longitude}&y=${latitude}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`
      )
      
      const data = await response.json()
      
      if (data.result?.geographies?.['116th Congressional Districts']?.[0]) {
        return parseInt(data.result.geographies['116th Congressional Districts'][0].BASENAME)
      }
      
      // Fallback: mock district for Nevada (since we're targeting Nevada first)
      if (this.isInNevada(latitude, longitude)) {
        return this.getNevadaDistrictFromCoordinates(latitude, longitude)
      }
      
      return undefined
    } catch (error) {
      console.error('Congressional district lookup error:', error)
      return undefined
    }
  }

  private async getTimezone(latitude: number, longitude: number): Promise<string | undefined> {
    try {
      if (!this.apiKey) return undefined

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/timezone/json?location=${latitude},${longitude}&timestamp=${Math.floor(Date.now() / 1000)}&key=${this.apiKey}`
      )
      
      const data = await response.json()
      return data.timeZoneId || undefined
    } catch (error) {
      console.error('Timezone lookup error:', error)
      return undefined
    }
  }

  private extractComponent(components: any[], type: string): string | undefined {
    const component = components.find(comp => comp.types.includes(type))
    return component?.short_name || component?.long_name
  }

  private isInNevada(latitude: number, longitude: number): boolean {
    // Rough bounding box for Nevada
    return latitude >= 35.0 && latitude <= 42.0 && longitude >= -120.0 && longitude <= -114.0
  }

  private getNevadaDistrictFromCoordinates(latitude: number, longitude: number): number {
    // Simplified Nevada congressional district mapping
    // District 1: Las Vegas area (southern Nevada)
    // District 2: Northern Nevada (Reno, Carson City)
    // District 3: Henderson/Boulder City area
    // District 4: Central/North Las Vegas

    if (latitude < 36.5) {
      // Southern Nevada - Las Vegas area
      if (longitude > -115.0) {
        return 3 // Henderson area
      } else if (latitude > 36.1) {
        return 4 // North Las Vegas
      } else {
        return 1 // Central Las Vegas
      }
    } else {
      // Northern Nevada
      return 2
    }
  }

  // Mock validation for development/testing
  private mockAddressValidation(
    street: string,
    city: string,
    state: string,
    zipCode: string
  ): AddressValidationResult {
    // Basic validation
    if (!street || !city || !state || !zipCode) {
      return {
        isValid: false,
        errorMessage: 'All address fields are required'
      }
    }

    // Mock coordinates for Nevada (targeting Reno area)
    const mockCoordinates: GeographicData = {
      latitude: 39.5296 + (Math.random() - 0.5) * 0.1, // Reno area with some variance
      longitude: -119.8138 + (Math.random() - 0.5) * 0.1,
      congressionalDistrict: state.toUpperCase() === 'NV' ? '2' : '1',
      county: state.toUpperCase() === 'NV' ? 'Washoe' : 'Mock County',
      timezone: 'America/Los_Angeles'
    }

    return {
      isValid: true,
      coordinates: mockCoordinates,
      formattedAddress: `${street}, ${city}, ${state} ${zipCode}`,
      congressionalDistrict: mockCoordinates.congressionalDistrict,
      county: mockCoordinates.county,
      timezone: mockCoordinates.timezone
    }
  }

  // Validate specific Nevada addresses for MVP
  async validateNevadaAddress(
    street: string,
    city: string,
    state: string,
    zipCode: string
  ): Promise<AddressValidationResult> {
    if (state.toUpperCase() !== 'NV') {
      return {
        isValid: false,
        errorMessage: 'Currently only Nevada addresses are supported in the MVP'
      }
    }

    // List of major Nevada cities for validation
    const nevadaCities = [
      'LAS VEGAS', 'HENDERSON', 'RENO', 'NORTH LAS VEGAS', 'SPARKS',
      'CARSON CITY', 'BOULDER CITY', 'ELKO', 'MESQUITE', 'FERNLEY'
    ]

    if (!nevadaCities.includes(city.toUpperCase())) {
      return {
        isValid: false,
        errorMessage: 'City not recognized. Please verify the city name.'
      }
    }

    // Nevada ZIP code validation
    const nevadaZipPattern = /^89[0-9]{3}$/
    if (!nevadaZipPattern.test(zipCode)) {
      return {
        isValid: false,
        errorMessage: 'Invalid Nevada ZIP code. Nevada ZIP codes start with 89.'
      }
    }

    return await this.validateAndGeocodeAddress(street, city, state, zipCode)
  }

  // Get voters in a specific district (for polling)
  async getDistrictBoundaries(district: string, state: string): Promise<any> {
    // This would integrate with redistricting APIs in production
    // For MVP, return mock boundaries
    return {
      district,
      state,
      boundaries: 'mock-boundary-data'
    }
  }
}

// Export singleton instance
const geographicVerification = new GeographicVerification()
export default geographicVerification
