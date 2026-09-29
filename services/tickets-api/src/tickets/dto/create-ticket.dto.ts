import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, MaxLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateTicketDto {
  @Transform(trim)
  @IsString()
  @Length(3, 200)
  subject!: string;

  @Transform(trim)
  @IsString()
  @Length(10, 5000)
  body!: string;

  @Transform(trim)
  @IsEmail()
  @MaxLength(254)
  customerEmail!: string;
}
