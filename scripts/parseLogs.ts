import es from 'event-stream';

process.stdin
  .pipe(es.split()) // Split input by lines
  .pipe(
    es.mapSync((line: string) => {
      try {
        return JSON.parse(line); // Parse each line as JSON
      } catch (err) {
        console.error('Invalid JSON:', line);
        return null; // Ignore invalid JSON lines
      }
    }),
  )
  .pipe(es.filterSync((obj: any) => obj && obj.level === 'info')) // Filter by 'level'
  .pipe(es.mapSync((obj: any) => JSON.stringify(obj) + '\n')) // Convert back to JSON string
  .pipe(process.stdout); // Output to stdout
