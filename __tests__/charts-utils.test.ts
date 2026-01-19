import {
  aggregateHourly,
  applyDateTimeRangeFilter,
  applyTimeRangeFilter,
} from "@/lib/charts/utils"

describe("charts utils", () => {
  test("aggregateHourly averages per hour", () => {
    const data = [
      { datetime: "2020-01-01T01:10:00", MW: 10 },
      { datetime: "2020-01-01T01:50:00", MW: 20 },
      { datetime: "2020-01-01T02:00:00", MW: 8 },
    ]

    const result = aggregateHourly(data, "solar")
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ date: "2020-01-01T01:00:00", solar: 15 })
    expect(result[1]).toEqual({ date: "2020-01-01T02:00:00", solar: 8 })
  })

  test("applyTimeRangeFilter filters by range", () => {
    const data = [
      { date: "2020-01-01T00:00:00", solar: 1 },
      { date: "2020-04-01T00:00:00", solar: 2 },
      { date: "2020-07-01T00:00:00", solar: 3 },
    ]

    const ranges = [
      { value: "2020-q1", label: "Q1 2020", start: "2020-01-01", end: "2020-03-31" },
    ]

    const result = applyTimeRangeFilter(data, "2020-q1", ranges)
    expect(result).toHaveLength(1)
    expect(result[0].date).toBe("2020-01-01T00:00:00")
  })

  test("applyDateTimeRangeFilter filters by start/end time", () => {
    const data = [
      { date: "2020-01-01T09:00:00", wind: 1 },
      { date: "2020-01-01T12:00:00", wind: 2 },
      { date: "2020-01-01T15:00:00", wind: 3 },
    ]

    const result = applyDateTimeRangeFilter(data, {
      mode: "range",
      from: new Date("2020-01-01"),
      to: new Date("2020-01-01"),
      fromTime: "10:00",
      toTime: "14:00",
    })

    expect(result).toHaveLength(1)
    expect(result[0].date).toBe("2020-01-01T12:00:00")
  })
})

