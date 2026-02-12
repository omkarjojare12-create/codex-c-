
export interface ExecutionResult {
  output: string;
  error: string;
  compileTime: string;
  state: 'finished' | 'waiting_for_input' | 'error';
}
