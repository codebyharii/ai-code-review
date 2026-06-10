import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  name!: string;

  @IsEmail({}, { message: 'Please provide a valid developer email address.' })
  email!: string;

  @MinLength(6, { message: 'Password must be at least 6 characters long.' })
  password!: string;
}

export class LoginDto {
  @IsEmail({}, { message: 'Please provide a valid developer email address.' })
  email!: string;

  @IsNotEmpty()
  password!: string;
}
