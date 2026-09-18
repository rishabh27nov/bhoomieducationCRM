export function validateEmployeeCategory({ category, salesSegment }) {
  if (!['Academic', 'Sales'].includes(category)) {
    throw new Error('Please select Academic or Sales as the employee category.');
  }
  if (category === 'Sales' && !['B2C', 'B2B2C'].includes(salesSegment)) {
    throw new Error('Sales employees must have a B2C or B2B2C segment.');
  }
  return { category, salesSegment: category === 'Sales' ? salesSegment : '' };
}

export function employeeCategoryLabel(employee) {
  return employee.category === 'Sales'
    ? `Sales${employee.salesSegment ? ` (${employee.salesSegment})` : ''}`
    : employee.category || 'Not assigned';
}
