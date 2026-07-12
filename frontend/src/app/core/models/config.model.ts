export interface BorrowingConfig {
  maxBooksPerUser: number;
  loanDurationDays: number;
  extendDurationDays: number;
  maxExtensions: number;
  finePerDayIrt: number;
}
