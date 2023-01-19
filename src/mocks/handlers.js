import { rest } from "msw";
import reporting from "./reporting.json";

const DAY_END_TIME = "17:00";

const DAY_PERIODS = [
  {
    period: "morning",
    time: "07:00",
  },
  {
    period: "pre-noon",
    time: "11:00",
  },
  {
    period: "evening",
    time: DAY_END_TIME,
  },
];

//// Get Time for the period
const getTime = (t) => {
  //// Create a dummy date to test the time, it could be valid
  const tmpDateTime = new Date(`2023-12-31 ${t}`);

  //// If time is valid then return
  if (Date.parse(tmpDateTime))
    return tmpDateTime.toISOString().split("T")[1].substring(0, 5);

  const f = DAY_PERIODS.find((p) => t.toLowerCase().includes(p.period));

  return f && f.time ? f.time : DAY_END_TIME;
};

//// Standard output for AG-GRID, even though AG-Grid provides helpers for formatting dates, but 
//// the heavy lifting should be done in the bg as we're are simulating here
const standarisedDateTime = (d, t = "") =>
  `${d} ${t.includes("00:00") || !t.includes(":") ? DAY_END_TIME : t}`;

//// Deal with fuzz dates.. the flag for inferred column needs to be true  
const inferredDate = (infDate) => {
  const d = new Date(infDate);
  return Date.parse(d)
    ? standarisedDateTime(
        new Date(d.getFullYear(), d.getMonth() + 1, 0)
          .toISOString()
          .split("T")[0]
      )
    : infDate; //// we could call fixFuzzy here, too
};


//// Covers:
//// dates with no time but rather periods i..e morning, pre-noon and so on, can be extended above
//// covers dd/mm/yyyy or with hypens or any other separator
//// NOTE: could be optimised
const fixFuzzy = (fuzzyDate) => {
  const d = new Date(fuzzyDate);

  
  if (Date.parse(d)) {
    //// Date is valid
    const isoDate = d.toISOString();
    const fDate = isoDate.split("T")[0];
    const fTime = isoDate.split("T")[1].substring(0, 5);
    return standarisedDateTime(fDate, fTime);
  } else {
    //// Invalid Dates 
    const pluckDate = fuzzyDate.substring(0, 10);
    const pluckTime = fuzzyDate.substring(10);
    if (Date.parse(pluckDate)) {
      //// Valid dates with fuzzy periods      
      const periodTime = getTime(pluckTime);
      return standarisedDateTime(pluckDate, periodTime);
    } else {
      //// Last thing to do is a reverse test
      const separator = pluckDate.match(/\D/)[0];
      const revPluckDate = pluckDate.split(separator).reverse().join(separator);
      const periodTime = getTime(pluckTime);
      return standarisedDateTime(revPluckDate, periodTime);
    }
  }
};

//// Transform by clearning up date and times, all keep original column for next reporting to compare with
const tReport = () => {
  return reporting.map((o) => ({
    ...o,
    nextReportingDate:
      o.nextReportingInferred === true
        ? inferredDate(o.nextReportingDate)
        : fixFuzzy(o.nextReportingDate),
    pristine: o.nextReportingDate,
  }));
};

export const handlers = [
  rest.get("/reporting", (req, res, ctx) => {
    const fixReport = tReport();
    return res(ctx.status(200), ctx.json(fixReport));
  }),
];
