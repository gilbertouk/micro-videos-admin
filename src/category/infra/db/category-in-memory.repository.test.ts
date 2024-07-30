import { Category } from '../../domain/category.entity';
import { CategoryInMemoryRepository } from './category-in-memory.repository';

describe('CategoryInMemoryRepository', () => {
  let repo: CategoryInMemoryRepository;

  beforeEach(() => (repo = new CategoryInMemoryRepository()));
  test('should no filter items when filter object is null', async () => {
    const items = [Category.fake().aCategory().build()];
    const filterSpy = jest.spyOn(items, 'filter' as any);

    const itemsFiltered = await repo['applyFilter'](items, null);
    expect(filterSpy).not.toHaveBeenCalled();
    expect(itemsFiltered).toStrictEqual(items);
  });

  test('should filter items using filter parameter', async () => {
    const items = [
      Category.fake().aCategory().withName('test').build(),
      Category.fake().aCategory().withName('TEST').build(),
      Category.fake().aCategory().withName('fake').build(),
    ];
    const filterSpy = jest.spyOn(items, 'filter' as any);

    const itemsFiltered = await repo['applyFilter'](items, 'TEST');
    expect(filterSpy).toHaveBeenCalledTimes(1);
    expect(itemsFiltered).toStrictEqual([items[0], items[1]]);
  });

  test('should sort by created_at when sort param is null', async () => {
    const created_at = new Date();

    const items = [
      Category.fake()
        .aCategory()
        .withName('test')
        .withCreatedAt(created_at)
        .build(),
      Category.fake()
        .aCategory()
        .withName('TEST')
        .withCreatedAt(new Date(created_at.getTime() + 100))
        .build(),
      Category.fake()
        .aCategory()
        .withName('fake')
        .withCreatedAt(new Date(created_at.getTime() + 200))
        .build(),
    ];

    const itemsSorted = await repo['applySort'](items, null, null);
    expect(itemsSorted).toStrictEqual([items[2], items[1], items[0]]);
  });

  test('should sort by name', async () => {
    const items = [
      Category.fake().aCategory().withName('c').build(),
      Category.fake().aCategory().withName('b').build(),
      Category.fake().aCategory().withName('a').build(),
    ];

    let itemsSorted = await repo['applySort'](items, 'name', 'asc');
    expect(itemsSorted).toStrictEqual([items[2], items[1], items[0]]);

    itemsSorted = await repo['applySort'](items, 'name', 'desc');
    expect(itemsSorted).toStrictEqual([items[0], items[1], items[2]]);
  });
});
