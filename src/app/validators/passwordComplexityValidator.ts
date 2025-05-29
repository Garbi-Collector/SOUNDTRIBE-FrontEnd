import { AbstractControl, ValidationErrors } from '@angular/forms';

export function passwordComplexityValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;

  const hasUpperCase = /[A-Z]/.test(value);
  const hasLowerCase = /[a-z]/.test(value);
  const hasSpecialChar = /[.\-_$%#&*]/.test(value); // ajustá los caracteres que aceptás
  const isValidLength = value.length >= 6 && value.length <= 20;

  const valid = hasUpperCase && hasLowerCase && hasSpecialChar && isValidLength;

  return valid ? null : {
    passwordComplexity: {
      hasUpperCase,
      hasLowerCase,
      hasSpecialChar,
      isValidLength
    }
  };
}
