import { Entity } from '../../../domain/entity';
import { NotFoundError } from '../../../domain/errors/not-found.error';
import { Uuid } from '../../../domain/value-objects/uuid.vo';
import { InMemoryRepository } from './in-memory-repository';

type StubEntityConstructor = {
  entity_id?: Uuid;
  name: string;
  price: number;
};

class StubEntity extends Entity {
  entity_id: Uuid;
  name: string;
  price: number;

  constructor(props: StubEntityConstructor) {
    super();
    this.entity_id = props.entity_id || new Uuid();
    this.name = props.name;
    this.price = props.price;
  }

  toJSON() {
    return {
      entity_id: this.entity_id.id,
      name: this.name,
      price: this.price,
    };
  }
}

class StubInMemoryRepository extends InMemoryRepository<StubEntity, Uuid> {
  getEntity(): new (...args: any[]) => StubEntity {
    return StubEntity;
  }
}

describe('InMemoryRepository Unit Tests', () => {
  let repo: StubInMemoryRepository;

  beforeEach(() => {
    repo = new StubInMemoryRepository();
  });

  test('should insert a new entity', async () => {
    const entity = new StubEntity({
      entity_id: new Uuid(),
      name: 'Test',
      price: 10,
    });

    await repo.insert(entity);

    expect(repo.items.length).toBe(1);
    expect(repo.items[0]).toBe(entity);
  });

  test('should bulk insert entities', async () => {
    const entities = [
      new StubEntity({
        entity_id: new Uuid(),
        name: 'Test 1',
        price: 10,
      }),
      new StubEntity({
        entity_id: new Uuid(),
        name: 'Test 2',
        price: 20,
      }),
    ];

    await repo.bulkInsert(entities);

    expect(repo.items.length).toBe(2);
    expect(repo.items).toEqual(entities);
    expect(repo.items[0]).toBe(entities[0]);
    expect(repo.items[1]).toBe(entities[1]);
  });

  test('should returns all entities', async () => {
    const entities = [
      new StubEntity({
        entity_id: new Uuid(),
        name: 'Test 1',
        price: 10,
      }),
      new StubEntity({
        entity_id: new Uuid(),
        name: 'Test 2',
        price: 20,
      }),
    ];

    await repo.bulkInsert(entities);

    const allEntities = await repo.findAll();

    expect(allEntities.length).toBe(2);
    expect(allEntities).toEqual(entities);
    expect(allEntities[0]).toBe(entities[0]);
    expect(allEntities[1]).toBe(entities[1]);
  });

  test('should throw an error when trying to find entity not found to update', async () => {
    const entity = new StubEntity({ name: 'foo', price: 10 });

    await expect(repo.update(entity)).rejects.toThrow(
      new NotFoundError(entity.entity_id, StubEntity)
    );
  });

  test('should update an existing entity', async () => {
    const entity = new StubEntity({
      entity_id: new Uuid(),
      name: 'Test',
      price: 10,
    });

    await repo.insert(entity);

    entity.name = 'Updated Test';
    entity.price = 20;

    await repo.update(entity);

    expect(repo.items[0]).toBe(entity);
    expect(entity.toJSON()).toStrictEqual(repo.items[0].toJSON());
  });

  test('should throw an error when trying to find entity not found to delete', async () => {
    const entity = new StubEntity({ name: 'foo', price: 10 });

    await expect(repo.delete(entity.entity_id)).rejects.toThrow(
      new NotFoundError(entity.entity_id, StubEntity)
    );
  });

  test('should delete an existing entity', async () => {
    const entity = new StubEntity({
      entity_id: new Uuid(),
      name: 'Test',
      price: 10,
    });

    await repo.insert(entity);

    await repo.delete(entity.entity_id);

    expect(repo.items.length).toBe(0);
    await expect(repo.findById(entity.entity_id)).resolves.toBeNull();
  });

  test('should find an existing entity by ID', async () => {
    const entity = new StubEntity({
      entity_id: new Uuid(),
      name: 'Test',
      price: 10,
    });

    await repo.insert(entity);

    const foundEntity = await repo.findById(entity.entity_id);

    expect(foundEntity).toBe(entity);
    expect(foundEntity.toJSON()).toStrictEqual(entity.toJSON());
  });

  test('should return null when trying to find a non-existing entity by ID', async () => {
    const foundEntity = await repo.findById(new Uuid());

    expect(foundEntity).toBeNull();
  });
});
