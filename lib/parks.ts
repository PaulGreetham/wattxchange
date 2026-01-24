export type EnergyType = "Solar" | "Wind"

export type ParkInfo = {
  name: string
  timezone: string
  energyType: EnergyType
}

export const parks: ParkInfo[] = [
  { name: "Netterden", timezone: "Europe/Amsterdam", energyType: "Wind" },
  { name: "Stadskanaal", timezone: "Europe/Bucharest", energyType: "Solar" },
  { name: "Windskanaal", timezone: "Europe/Istanbul", energyType: "Wind" },
  { name: "Zwartenbergseweg", timezone: "Europe/Volgograd", energyType: "Wind" },
  { name: "Bemmel", timezone: "Europe/Vienna", energyType: "Solar" },
]

export const solarParks = parks.filter((park) => park.energyType === "Solar")
export const windParks = parks.filter((park) => park.energyType === "Wind")

export const solarHashToPark = Object.fromEntries(
  solarParks.map((park) => [`${park.name.toLowerCase()}-solar`, park.name])
)

export const windHashToPark = Object.fromEntries(
  windParks.map((park) => [`${park.name.toLowerCase()}-wind`, park.name])
)

