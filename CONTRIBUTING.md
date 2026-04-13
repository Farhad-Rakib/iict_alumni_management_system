# Contributing to Alumni Management System

Thank you for your interest in contributing! This document outlines guidelines for contributions.

## Code of Conduct

- Be respectful and inclusive
- Support each other's learning
- Welcome diverse perspectives
- Report issues constructively

## Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Write tests for new functionality
5. Submit a pull request

## Development Setup

### Backend
```bash
cd tms_be
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Frontend
```bash
cd tms_ui
npm install
npm run dev
```

## Coding Standards

### Backend (Python)
- Follow PEP 8
- Use type hints
- Write docstrings
- Max line length: 100 characters
- Use async/await for I/O operations

```python
def example_function(param: str) -> dict:
    """
    Brief description.
    
    Args:
        param: Parameter description
        
    Returns:
        Dictionary with result
    """
    return {"result": param}
```

### Frontend (TypeScript)
- Use TypeScript strictly
- Follow ESLint rules
- Write JSDoc comments
- Keep components small and focused

```typescript
interface Props {
  title: string;
  onClick: () => void;
}

/**
 * Button component
 * @param props - Component props
 * @returns React component
 */
function Button({ title, onClick }: Props): JSX.Element {
  return <button onClick={onClick}>{title}</button>;
}
```

## Commit Messages

- Use present tense: "Add feature" not "Added feature"
- Be descriptive but concise
- Reference issues: "Fixes #123"

Examples:
```
Add alumni search functionality
Fix authentication token refresh issue
Refactor event service for better performance
```

## Pull Request Process

1. **Title**: Clearly describe what the PR does
2. **Description**: 
   - Why this change is needed
   - How it works
   - Any breaking changes
3. **Tests**: Include test coverage
4. **Documentation**: Update docs if needed
5. **Screenshots**: For UI changes
6. **Checklist**:
   - [ ] Code follows style guidelines
   - [ ] Tests pass locally
   - [ ] Documentation updated
   - [ ] No breaking changes (or clearly noted)

Example PR template:
```markdown
## Description
This PR adds search functionality to the alumni directory.

## Type of Change
- [x] New feature
- [ ] Bug fix
- [ ] Breaking change

## Testing
- [x] Unit tests added
- [x] Integration tests passed
- [x] Manual testing done

## Screenshots
[Add screenshots for UI changes]

## Checklist
- [x] My code follows the style guidelines
- [x] I have performed a self-review
- [x] I have commented my code
- [x] Tests pass locally
```

## Testing

### Backend Tests
```bash
cd tms_be
pytest
pytest --cov=app       # With coverage
pytest tests/test_*.py # Specific tests
```

### Frontend Tests
```bash
cd tms_ui
npm run test
npm run test:coverage
```

### Test Structure
```python
# tests/test_services.py
import pytest
from app.services import UserService

@pytest.fixture
def user_service():
    return UserService()

def test_create_user(user_service):
    user = user_service.create_user(email="test@example.com")
    assert user.email == "test@example.com"
```

## Documentation

### Update these when adding features:
- `README.md` - Overview and setup
- `API_DOCUMENTATION.md` - API endpoints
- `PROJECT_STRUCTURE.md` - Folder structure
- Code comments - Docstrings and complex logic
- `SETUP_GUIDE.md` - Installation steps if changed

### Documentation Style
```markdown
### Feature Name

Brief description of what it does.

**Endpoint:** `GET /api/v1/endpoint`

**Parameters:**
- `param` (type) - Description

**Response:**
```json
{
  "success": true,
  "data": {}
}
```
```

## Issue Reporting

### When reporting an issue:
1. Check if issue already exists
2. Use clear, descriptive title
3. Provide reproduction steps
4. Include error messages and logs
5. Mention your environment

Example:
```markdown
**Title:** Alumni search fails for special characters

**Description:**
Search breaks when special characters are in the query.

**Steps to reproduce:**
1. Go to alumni search
2. Enter "John & Jane"
3. Click search

**Expected:** Results for both John and Jane
**Actual:** 500 error

**Environment:**
- OS: macOS 12
- Browser: Chrome 120
- Version: 1.0.0
```

## Feature Requests

### Template:
```markdown
**Title:** Add export to CSV functionality

**Description:**
Users should be able to export alumni directory to CSV.

**Why:** Useful for data analysis and sharing reports

**Proposed Solution:**
Add "Export" button to alumni search results
```

## Review Process

1. **Automatic Checks**
   - Tests pass
   - Coverage maintained
   - Linting passes
   - Types check (TypeScript)

2. **Code Review**
   - Correctness
   - Performance
   - Security
   - Documentation
   - Tests

3. **Feedback**
   - Be respectful
   - Ask questions
   - Suggest improvements
   - Acknowledge good work

## Merge Requirements

- ✅ All tests passing
- ✅ Code review approved
- ✅ No conflicts with main
- ✅ Commit messages clear
- ✅ Documentation updated (if needed)

## Release Process

1. Update version in `package.json` and setup.py
2. Update `CHANGELOG.md`
3. Create release tag: `git tag v1.0.0`
4. Push to GitHub
5. Create GitHub Release
6. Deploy to production

## Areas for Contribution

### High Priority
- [ ] Email notification service
- [ ] Advanced search functionality
- [ ] Performance optimization
- [ ] Security enhancements

### Medium Priority
- [ ] Enhanced error handling
- [ ] More analytics features
- [ ] API documentation improvements
- [ ] Test coverage expansion

### Low Priority
- [ ] UI/UX improvements
- [ ] New themes
- [ ] Additional languages
- [ ] Tool integrations

## Questions?

- Open a GitHub discussion
- Email: development@alumni.com
- Join our Slack channel

## Recognition

Contributors are recognized in:
- `CONTRIBUTORS.md`
- Release notes
- Project acknowledgments

Thank you for contributing! 🎉

---

## Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [PEP 8 Style Guide](https://www.python.org/dev/peps/pep-0008/)
- [Tailwind CSS](https://tailwindcss.com/docs)
