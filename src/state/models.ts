export interface DataCallState {
  progress: boolean;
  err?: string;
}

export class Pair<L, R> {
  private l: L;
  private r: R;

  constructor(l: L, r: R) {
    this.l = l;
    this.r = r;
  }

  left(): L {
    return this.l;
  }

  right(): R {
    return this.r;
  }
}
