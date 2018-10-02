declare module 'coverage'{

  export interface Line {
      DA: string;
      hits: string;
  }

  export interface TN {
      SF: string;
      lines: Line[];
      LH: string;
      LF: string;
  }

  export interface LCov {
      TNs: TN[];
  }

  export interface RootObject {
      lcov: LCov;
  }

}

