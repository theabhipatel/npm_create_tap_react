export interface Template {
  name: string;
  value: string;
  repo: string;
  description: string;
  available: boolean;
}

export interface InquirerChoice {
  name: string;
  value: string;
  short: string;
}

export interface TemplateSelection {
  template: string;
}

export interface ProjectNameInput {
  projectName: string;
}

export interface OverwriteConfirmation {
  overwrite: boolean;
}

export interface PackageJson {
  scripts?: Record<string, string>;
  [key: string]: any;
}
