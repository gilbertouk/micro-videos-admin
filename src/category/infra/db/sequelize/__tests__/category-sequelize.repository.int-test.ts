import { DataType, Sequelize } from 'sequelize-typescript';
import { CategoryModel } from '../category.model';
import { CategorySequelizeRepository } from '../category-sequelize.repository';
import { Category } from '../../../../domain/category.entity';
import { Uuid } from '../../../../../shared/domain/value-objects/uuid.vo';
import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';

describe('CategorySequelizeRepository Integration Tests', () => {
  let sequelize;
  let repository: CategorySequelizeRepository;

  beforeEach(async () => {
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: ':memory:',
      logging: false,
      models: [CategoryModel],
    });

    await sequelize.sync({ force: true });
    repository = new CategorySequelizeRepository(CategoryModel);
  });

  test('should insert a new category', async () => {
    let category = Category.create({ name: 'Movie' });
    console.log(category.category_id.id);
    await repository.insert(category);
    let entity = await repository.findById(category.category_id);
    expect(entity.toJSON()).toStrictEqual(category.toJSON());

    category = Category.create({
      name: 'Movie',
      description: 'Movie description',
      is_active: false,
    });
    await repository.insert(category);
    entity = await repository.findById(category.category_id);
    expect(entity.toJSON()).toStrictEqual(category.toJSON());
  });

  test('should finds a entity by id', async () => {
    let entityFound = await repository.findById(new Uuid());
    console.log(entityFound);
    expect(entityFound).toBeNull();

    const entity = Category.fake().aCategory().build();
    await repository.insert(entity);
    entityFound = await repository.findById(entity.category_id);
    expect(entityFound.toJSON()).toStrictEqual(entity.toJSON());
  });

  test('should return all categories', async () => {
    const entity = Category.fake().aCategory().build();
    await repository.insert(entity);
    const entities = await repository.findAll();
    expect(entities).toHaveLength(1);
    expect(JSON.stringify(entities)).toBe(JSON.stringify([entity]));
  });

  test('should return error on update when a entity is not found', async () => {
    const entity = Category.fake().aCategory().build();
    await expect(repository.update(entity)).rejects.toThrow(
      new NotFoundError(entity.category_id, Category)
    );
  });

  test('should update a entity', async () => {
    const entity = Category.fake().aCategory().build();
    await repository.insert(entity);
    entity.changeName('Updated Category');
    await repository.update(entity);
    const updatedEntity = await repository.findById(entity.category_id);
    expect(updatedEntity.toJSON()).toStrictEqual(entity.toJSON());
  });

  test('should throw an error on delete when a entity not found', async () => {
    const categoryId = new Uuid();
    await expect(repository.delete(categoryId)).rejects.toThrow(
      new NotFoundError(categoryId.id, Category)
    );
  });

  test('should delete a entity', async () => {
    const entity = Category.fake().aCategory().build();
    await repository.insert(entity);
    await repository.delete(entity.category_id);
    let entityFound = await repository.findById(entity.category_id);
    expect(entityFound).toBeNull();
  });
});
