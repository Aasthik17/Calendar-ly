// /src/data/sampleNotes.ts

export function getSampleNotes(year: number): Record<string, string> {
  return {
    [`${year}-07`]: `Book the cabin before prices go up. Call Aasthik about the weekend plans. Don't forget sunscreen — last summer was a disaster.`,

    [`${year}-07-05:${year}-07-12`]: `Summer getaway. Morning runs along the coast. Finish the book I've been neglecting since March.`,

    [`${year}-10`]: `October always feels like the year's turning point. Follow up on the project proposal. Get the winter coat out of storage.`,

    [`${year}-12`]: `End of year wind-down. Gifts: Dad — something practical. Mom — flowers & a good dinner. Set up the out-of-office from the 24th.`,
  };
}
