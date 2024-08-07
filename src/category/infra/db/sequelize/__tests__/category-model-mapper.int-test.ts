import { Sequelize } from 'sequelize-typescript';
import { CategoryModel } from '../category.model';
import { CategoryModelMapper } from '../category-model-mapper';
import { EntityValidationError } from '../../../../../shared/domain/validators/validation.error';
import { Category } from '../../../../domain/category.entity';
import { Uuid } from '../../../../../shared/domain/value-objects/uuid.vo';
import { setupSequelize } from '../../../../../shared/infra/testing/helpers';

describe('CategoryModelMapper Integration Tests', () => {
  setupSequelize({ models: [CategoryModel] });

  test('should throws error when category is invalid', () => {
    const model = CategoryModel.build({
      category_id: '9366b7dc-2d71-4799-b91c-c64adb205104',
    });
    try {
      CategoryModelMapper.toEntity(model);
      fail(
        'The category is valid, but it needs to throws a EntityValidationError'
      );
    } catch (e) {
      expect(e).toBeInstanceOf(EntityValidationError);
      expect((e as EntityValidationError).error).toMatchObject({
        name: [
          'name should not be empty',
          'name must be a string',
          'name must be shorter than or equal to 250 characters',
        ],
      });
    }
  });

  test('should convert a category model to a category aggregate', () => {
    const created_at = new Date();
    const model = CategoryModel.build({
      category_id: '9366b7dc-2d71-4799-b91c-c64adb205104',
      name: 'Movie',
      description: 'Movie description',
      is_active: true,
      created_at,
    });
    const aggregate = CategoryModelMapper.toEntity(model);
    expect(aggregate.toJSON()).toStrictEqual(
      new Category({
        category_id: new Uuid('9366b7dc-2d71-4799-b91c-c64adb205104'),
        name: 'Movie',
        description: 'Movie description',
        is_active: true,
        created_at,
      }).toJSON()
    );
  });

  test('should convert category aggregate to category model', () => {
    const created_at = new Date();
    const aggregate = new Category({
      category_id: new Uuid('9366b7dc-2d71-4799-b91c-c64adb205104'),
      name: 'Movie',
      description: 'Movie description',
      is_active: true,
      created_at,
    });
    const model = CategoryModelMapper.toModel(aggregate);
    expect(model.toJSON()).toStrictEqual(
      CategoryModel.build({
        category_id: '9366b7dc-2d71-4799-b91c-c64adb205104',
        name: 'Movie',
        description: 'Movie description',
        is_active: true,
        created_at,
      }).toJSON()
    );
  });
});
