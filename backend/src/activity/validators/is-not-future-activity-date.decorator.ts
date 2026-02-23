import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

const ISO_DATE_PART_REGEX = /^(\d{4}-\d{2}-\d{2})/;

function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function extractIsoDatePart(value: string): string | null {
  const match = ISO_DATE_PART_REGEX.exec(value);
  return match ? match[1] : null;
}

export function IsNotFutureActivityDate(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string): void => {
    registerDecorator({
      name: 'isNotFutureActivityDate',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (value === null || value === undefined) {
            return true;
          }
          if (typeof value !== 'string') {
            return false;
          }

          const datePart = extractIsoDatePart(value);
          if (!datePart) {
            return true;
          }

          return datePart <= toLocalIsoDate(new Date());
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} cannot be in the future`;
        },
      },
    });
  };
}
