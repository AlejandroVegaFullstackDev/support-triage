import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CreateTicketDto } from './dto/create-ticket.dto.js';
import { toTicketResponse } from './dto/ticket-response.dto.js';
import type { TicketResponse } from './dto/ticket-response.dto.js';
import { TicketsService } from './tickets.service.js';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly tickets: TicketsService) {}

  @Post()
  async create(@Body() dto: CreateTicketDto): Promise<TicketResponse> {
    return toTicketResponse(await this.tickets.create(dto));
  }

  @Get()
  async list(): Promise<TicketResponse[]> {
    return (await this.tickets.listRecent()).map(toTicketResponse);
  }

  @Get(':id')
  async get(@Param('id', new ParseUUIDPipe()) id: string): Promise<TicketResponse> {
    return toTicketResponse(await this.tickets.getById(id));
  }
}
