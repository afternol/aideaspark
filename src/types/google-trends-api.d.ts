declare module "google-trends-api" {
  interface InterestOverTimeOptions {
    keyword: string | string[];
    startTime?: Date;
    endTime?: Date;
    geo?: string;
    hl?: string;
    category?: number;
  }

  function interestOverTime(options: InterestOverTimeOptions): Promise<string>;

  export default { interestOverTime };
}
