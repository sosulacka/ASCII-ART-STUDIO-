import { t, type Lang } from './i18n';

interface ParsedError {
  key: string;
  params: string[];
}

export function parseRustError(errorString: string): ParsedError | null {
  try {
    const jsonMatch = errorString.match(/\{[^}]+\}/);
    if (!jsonMatch) return null;
    
    const parsed = JSON.parse(jsonMatch[0]);
    if (parsed.key && Array.isArray(parsed.params)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function localizeError(errorString: string, lang: Lang): string {
  const parsed = parseRustError(errorString);
  if (!parsed) {
    return errorString;
  }
  
  const strings = t(lang);
  const template = (strings as any)[parsed.key];
  
  if (!template) {
    return errorString;
  }
  
  let result = template;
  parsed.params.forEach((param, index) => {
    result = result.replace(`{${index}}`, param);
  });
  
  return result;
}
