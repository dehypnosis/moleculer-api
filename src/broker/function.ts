import * as vm from "vm";
import * as tslib from "tslib";
import { RecursivePartial } from "../interface";
import { Reporter } from "./reporter";

export type InlineFunctionProps<Args> = {
  function: string;
  mappableKeys: Array<Extract<keyof Args, string>>;
  reporter: Reporter;
};

export type InlineFunctionOptions = {
  util: {[key: string]: any};
};

interface PartialConsole {
  debug: Console["debug"];
  error: Console["error"];
  info: Console["error"];
  log: Console["error"];
  warn: Console["error"];
  trace: Console["trace"];
}

class DummyConsole implements PartialConsole {
  private readonly reporter: Reporter;
  constructor(reporter: Reporter) {
    this.reporter = reporter;
  }
  public debug(...messages: any[]): void {
    this.reporter.debug(messages.length === 1 ? [0] : messages);
  }
  public error(...messages: any[]): void {
    this.reporter.error(messages.length === 1 ? messages[0] : messages);
  }
  public info(...messages: any[]): void {
    this.reporter.info(messages.length === 1 ? messages[0] : messages);
  }
  public warn(...messages: any[]): void {
    this.reporter.warn(messages.length === 1 ? messages[0] : messages);
  }
  public trace(...messages: any[]): void {
    messages.push(new Error().stack);
    this.reporter.info(messages.length === 1 ? messages[0] : messages);
  }
  public log(...messages: any[]): void {
    this.reporter.debug(messages.length === 1 ? messages[0] : messages);
  }
}

export function createInlineFunction<Args extends {[key: string]: any}, Return = any>(props: InlineFunctionProps<Args>, opts?: RecursivePartial<InlineFunctionOptions>): (args: Args) => Return {
  const script = new vm.Script(`(${props.function})({ ${props.mappableKeys.join(", ")} })`, {
    displayErrors: true,
    timeout: 100,
  });

  const sandbox = {
    console: new DummyConsole(props.reporter),
    util: opts && opts.util || {},
    ...tslib,
  };

  return (args: Args): Return => {
    return script.runInNewContext({...sandbox, ...args});
  };
}
