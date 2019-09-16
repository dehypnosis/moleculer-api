import { HasStaticKey } from "../interface";

export type LoggerProps = {
  label: string;
};

export abstract class Logger extends HasStaticKey {
  constructor(protected readonly props: LoggerProps, opts?: any) {
    super();
  }

  public abstract info(...args: any[]): void;

  public abstract warn(...args: any[]): void;

  public abstract debug(...args: any[]): void;

  public abstract error(...args: any[]): void;

  public abstract getChild(label: string): Logger;
}
