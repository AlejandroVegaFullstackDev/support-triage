import 'reflect-metadata';
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';

describe('GET /health', () => {
  let app: INestApplication;

  before(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    await app.init();
  });

  after(async () => {
    await app.close();
  });

  it('returns ok', async () => {
    const response = await request(app.getHttpServer()).get('/health');

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { status: 'ok', service: 'tickets-api' });
  });
});
