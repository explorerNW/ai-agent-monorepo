import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateAnalyticsDto } from './create-analytics.dto';

export class CreateAnalyticsArrayDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAnalyticsDto)
  events!: CreateAnalyticsDto[];
}
