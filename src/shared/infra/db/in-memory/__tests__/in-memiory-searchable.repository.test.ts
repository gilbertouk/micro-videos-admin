import { Entity } from '../../../../domain/entity';
import { SearchParams } from '../../../../domain/repository/search-params';
import { SearchResult } from '../../../../domain/repository/search-result';
import { Uuid } from '../../../../domain/value-objects/uuid.vo';
import { InMemorySearchableRepository } from '../in-memory-repository';

type StubEntityConstructorProps = {
  entity_id?: Uuid;
  name: string;
  price: number;
};

class StubEntity extends Entity {
  entity_id: Uuid;
  name: string;
  price: number;

  constructor(props: StubEntityConstructorProps) {
    super();
    this.entity_id = props.entity_id || new Uuid();
    this.name = props.name;
    this.price = +props.price;
  }

  toJSON() {
    return {
      entity_id: this.entity_id.id,
      name: this.name,
      price: this.price,
    };
  }
}

class StubInMemorySearchableRepository extends InMemorySearchableRepository<
  StubEntity,
  Uuid
> {
  sortableFields: string[] = ['name'];

  protected async applyFilter(
    items: StubEntity[],
    filter: string | null
  ): Promise<StubEntity[]> {
    if (!filter) {
      return items;
    }

    return items.filter((i) => {
      return (
        i.name.toLowerCase().includes(filter.toLowerCase()) ||
        i.price.toString() === filter
      );
    });
  }
  getEntity(): new (...args: any[]) => StubEntity {
    return StubEntity;
  }
}

describe('InMemorySearchableRepository Unit Tests', () => {
  let repo: StubInMemorySearchableRepository;

  beforeEach(() => (repo = new StubInMemorySearchableRepository()));

  describe('applyFilter method', () => {
    test('should return all items when filter is null', async () => {
      const items = [
        new StubEntity({ entity_id: new Uuid(), name: 'Test 1', price: 10 }),
        new StubEntity({ entity_id: new Uuid(), name: 'Test 2', price: 20 }),
      ];

      const spyFilterMethod = jest.spyOn(items, 'filter' as any);

      const result = await repo['applyFilter'](items, null);

      expect(result).toStrictEqual(items);
      expect(spyFilterMethod).not.toHaveBeenCalled();
    });

    test('should return filtered items when filter is provided', async () => {
      const items = [
        new StubEntity({ entity_id: new Uuid(), name: 'TEST', price: 10 }),
        new StubEntity({ entity_id: new Uuid(), name: 'test', price: 20 }),
        new StubEntity({ entity_id: new Uuid(), name: 'fake', price: 30 }),
      ];

      const spyFilterMethod = jest.spyOn(items, 'filter' as any);
      let filteredItems = await repo['applyFilter'](items, 'TEST');

      expect(filteredItems).toStrictEqual([items[0], items[1]]);
      expect(spyFilterMethod).toHaveBeenCalledTimes(1);

      filteredItems = await repo['applyFilter'](items, '20');
      expect(filteredItems).toStrictEqual([items[1]]);
      expect(spyFilterMethod).toHaveBeenCalledTimes(2);

      filteredItems = await repo['applyFilter'](items, 'no-filter');
      expect(filteredItems).toHaveLength(0);
      expect(spyFilterMethod).toHaveBeenCalledTimes(3);
    });

    describe('applySort method', () => {
      test('should no sort items when no sort field is provided', async () => {
        const items = [
          new StubEntity({ entity_id: new Uuid(), name: 'Test 1', price: 10 }),
          new StubEntity({ entity_id: new Uuid(), name: 'Test 2', price: 20 }),
        ];

        let sortedItems = await repo['applySort'](items, null, null);

        expect(sortedItems).toStrictEqual(items);

        sortedItems = await repo['applySort'](items, 'price', 'asc');
        expect(sortedItems).toStrictEqual(items);
      });

      test('should sort items by provided sort field', async () => {
        const items = [
          new StubEntity({ entity_id: new Uuid(), name: 'b', price: 10 }),
          new StubEntity({ entity_id: new Uuid(), name: 'a', price: 20 }),
          new StubEntity({ entity_id: new Uuid(), name: 'c', price: 15 }),
        ];

        let sortedItems = await repo['applySort'](items, 'name', 'asc');
        expect(sortedItems).toStrictEqual([items[1], items[0], items[2]]);

        sortedItems = await repo['applySort'](items, 'name', 'desc');
        expect(sortedItems).toStrictEqual([items[2], items[0], items[1]]);
      });
    });

    describe('applyPaginate method', () => {
      test('should return all items when no pagination is provided', async () => {
        const items = [
          new StubEntity({ entity_id: new Uuid(), name: 'Test 1', price: 10 }),
          new StubEntity({ entity_id: new Uuid(), name: 'Test 2', price: 20 }),
          new StubEntity({ entity_id: new Uuid(), name: 'Test 3', price: 30 }),
          new StubEntity({ entity_id: new Uuid(), name: 'Test 4', price: 40 }),
          new StubEntity({ entity_id: new Uuid(), name: 'Test 5', price: 50 }),
        ];

        let paginatedItems = await repo['applyPaginate'](items, 1, 2);

        expect(paginatedItems).toStrictEqual([items[0], items[1]]);

        paginatedItems = await repo['applyPaginate'](items, 2, 2);
        expect(paginatedItems).toStrictEqual([items[2], items[3]]);

        paginatedItems = await repo['applyPaginate'](items, 3, 2);
        expect(paginatedItems).toStrictEqual([items[4]]);

        paginatedItems = await repo['applyPaginate'](items, 4, 2);
        expect(paginatedItems).toHaveLength(0);
        expect(paginatedItems).toStrictEqual([]);
      });
    });

    describe('search method', () => {
      test('should apply only paginate when other params are null', async () => {
        const entity = new StubEntity({
          entity_id: new Uuid(),
          name: 'Test 1',
          price: 10,
        });
        const items = Array(16).fill(entity);

        repo.items = items;

        const result = await repo.search(new SearchParams());
        expect(result).toStrictEqual(
          new SearchResult({
            items: Array(15).fill(entity),
            total: 16,
            current_page: 1,
            per_page: 15,
          })
        );
      });

      test('should apply paginate and filter', async () => {
        const items = [
          new StubEntity({ name: 'Test', price: 10 }),
          new StubEntity({ name: 'a', price: 20 }),
          new StubEntity({ name: 'TeST', price: 30 }),
          new StubEntity({ name: 'b', price: 40 }),
          new StubEntity({ name: 'TEST', price: 50 }),
        ];

        repo.items = items;

        let result = await repo.search(
          new SearchParams({ page: 1, per_page: 2, filter: 'TEST' })
        );
        expect(result).toStrictEqual(
          new SearchResult({
            items: [items[0], items[2]],
            total: 3,
            current_page: 1,
            per_page: 2,
          })
        );

        result = await repo.search(
          new SearchParams({ page: 2, per_page: 2, filter: 'TEST' })
        );
        expect(result).toStrictEqual(
          new SearchResult({
            items: [items[4]],
            total: 3,
            current_page: 2,
            per_page: 2,
          })
        );
      });

      describe('should apply paginate and sort', () => {
        const items = [
          new StubEntity({ name: 'b', price: 5 }),
          new StubEntity({ name: 'a', price: 5 }),
          new StubEntity({ name: 'd', price: 5 }),
          new StubEntity({ name: 'e', price: 5 }),
          new StubEntity({ name: 'c', price: 5 }),
        ];
        const arrange = [
          {
            search_params: new SearchParams({
              page: 1,
              per_page: 2,
              sort: 'name',
            }),
            search_result: new SearchResult({
              items: [items[1], items[0]],
              total: 5,
              current_page: 1,
              per_page: 2,
            }),
          },
          {
            search_params: new SearchParams({
              page: 2,
              per_page: 2,
              sort: 'name',
            }),
            search_result: new SearchResult({
              items: [items[4], items[2]],
              total: 5,
              current_page: 2,
              per_page: 2,
            }),
          },
          {
            search_params: new SearchParams({
              page: 1,
              per_page: 2,
              sort: 'name',
              sort_dir: 'desc',
            }),
            search_result: new SearchResult({
              items: [items[3], items[2]],
              total: 5,
              current_page: 1,
              per_page: 2,
            }),
          },
          {
            search_params: new SearchParams({
              page: 2,
              per_page: 2,
              sort: 'name',
              sort_dir: 'desc',
            }),
            search_result: new SearchResult({
              items: [items[4], items[0]],
              total: 5,
              current_page: 2,
              per_page: 2,
            }),
          },
        ];

        beforeEach(() => {
          repo.items = items;
        });

        test.each(arrange)(
          'when value is %j',
          async ({ search_params, search_result }) => {
            const result = await repo.search(search_params);
            expect(result).toStrictEqual(search_result);
          }
        );
      });

      test('should search using filter, sort and paginate', async () => {
        const items = [
          new StubEntity({ name: 'test', price: 5 }),
          new StubEntity({ name: 'a', price: 5 }),
          new StubEntity({ name: 'TEST', price: 5 }),
          new StubEntity({ name: 'e', price: 5 }),
          new StubEntity({ name: 'TeSt', price: 5 }),
        ];
        repo.items = items;

        const arrange = [
          {
            params: new SearchParams({
              page: 1,
              per_page: 2,
              sort: 'name',
              filter: 'TEST',
            }),
            result: new SearchResult({
              items: [items[2], items[4]],
              total: 3,
              current_page: 1,
              per_page: 2,
            }),
          },
          {
            params: new SearchParams({
              page: 2,
              per_page: 2,
              sort: 'name',
              filter: 'TEST',
            }),
            result: new SearchResult({
              items: [items[0]],
              total: 3,
              current_page: 2,
              per_page: 2,
            }),
          },
        ];

        for (const i of arrange) {
          const result = await repo.search(i.params);
          expect(result).toStrictEqual(i.result);
        }
      });
    });
  });
});
