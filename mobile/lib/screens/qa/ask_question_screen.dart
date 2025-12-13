import 'package:flutter/material.dart';
import '../../services/qa_service.dart';
import '../../services/storage_service.dart';

class AskQuestionScreen extends StatefulWidget {
  const AskQuestionScreen({Key? key}) : super(key: key);

  static const routeName = '/qa/create';

  @override
  State<AskQuestionScreen> createState() => _AskQuestionScreenState();
}

class _AskQuestionScreenState extends State<AskQuestionScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _contentController = TextEditingController();
  final QAService _qaService = QAService();
  bool _isSubmitting = false;
  List<String> _selectedTags = [];

  @override
  void dispose() {
    _titleController.dispose();
    _contentController.dispose();
    super.dispose();
  }

  Future<void> _submitQuestion() async {
    if (!_formKey.currentState!.validate()) return;

    if (_selectedTags.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select at least one tag')),
      );
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      final token = await StorageService.getJwtAccessToken();
      _qaService.token = token;

      await _qaService.createQuestion(
        title: _titleController.text.trim(),
        content: _contentController.text.trim(),
        tags: _selectedTags,
        isCommentable: true,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Question posted successfully!')),
        );
        Navigator.of(context).pop(true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  void _toggleTag(String tag) {
    setState(() {
      if (_selectedTags.contains(tag)) {
        _selectedTags.remove(tag);
      } else {
        _selectedTags.add(tag);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Ask a Question'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Title Field
            TextFormField(
              controller: _titleController,
              decoration: const InputDecoration(
                labelText: 'Title',
                hintText: 'Enter your question title',
                border: OutlineInputBorder(),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Please enter a title';
                }
                if (value.trim().length < 10) {
                  return 'Title must be at least 10 characters';
                }
                return null;
              },
              maxLength: 200,
            ),
            const SizedBox(height: 16),

            // Content Field
            TextFormField(
              controller: _contentController,
              decoration: const InputDecoration(
                labelText: 'Question Details',
                hintText: 'Describe your question in detail',
                border: OutlineInputBorder(),
                alignLabelWithHint: true,
              ),
              maxLines: 10,
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Please enter question details';
                }
                if (value.trim().length < 20) {
                  return 'Details must be at least 20 characters';
                }
                return null;
              },
            ),
            const SizedBox(height: 24),

            // Tags Section
            Text(
              'Select Tags',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Choose tags that best describe your question',
              style: theme.textTheme.bodySmall?.copyWith(
                color: Colors.grey,
              ),
            ),
            const SizedBox(height: 12),

            // Tags Grid
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: QAService.availableTags.map((tag) {
                final isSelected = _selectedTags.contains(tag);
                return FilterChip(
                  label: Text(
                    tag,
                    style: TextStyle(
                      color: isSelected ? Colors.white : theme.primaryColor,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    ),
                  ),
                  selected: isSelected,
                  onSelected: (_) => _toggleTag(tag),
                  selectedColor: theme.primaryColor,
                  checkmarkColor: Colors.white,
                  backgroundColor: Colors.transparent,
                  side: BorderSide(
                    color: theme.primaryColor,
                    width: isSelected ? 2 : 1,
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 24),

            // Submit Button
            SizedBox(
              height: 48,
              child: ElevatedButton(
                onPressed: _isSubmitting ? null : _submitQuestion,
                child: _isSubmitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor:
                              AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : const Text('Post Question'),
              ),
            ),
            const SizedBox(height: 16),

            // Guidelines Card
            Card(
              color: Colors.transparent,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: BorderSide(
                  color: theme.primaryColor,
                  width: 1,
                ),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons.info_outline,
                          color: theme.primaryColor,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Question Guidelines',
                          style: theme.textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: theme.primaryColor,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    _buildGuideline('• Be specific and clear in your title'),
                    _buildGuideline(
                        '• Provide enough context in the details'),
                    _buildGuideline('• Select relevant tags'),
                    _buildGuideline('• Be respectful and courteous'),
                    _buildGuideline(
                        '• Only dietitians can answer your questions'),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGuideline(String text) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Text(
        text,
        style: theme.textTheme.bodyMedium?.copyWith(
          color: theme.textTheme.bodyLarge?.color,
        ),
      ),
    );
  }
}
