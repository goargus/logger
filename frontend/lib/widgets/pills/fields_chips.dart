import 'package:flutter/material.dart';

import '../../core/layout_constants.dart';

class FieldsChips extends StatelessWidget {
  final List<String> fields;

  const FieldsChips({
    super.key,
    required this.fields,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(
          'Campos a Cargo:',
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
        ),
        const SizedBox(width: LayoutConstants.spacing12),
        ...fields.map((field) => Padding(
              padding: const EdgeInsets.only(right: LayoutConstants.spacing8),
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: LayoutConstants.spacing16,
                  vertical: LayoutConstants.spacing6,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFFEFEFFF),
                  borderRadius:
                      BorderRadius.circular(LayoutConstants.borderRadius20),
                ),
                child: Text(
                  field,
                  style: const TextStyle(
                    color: Color.fromARGB(255, 0, 0, 0),
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
              ),
            )),
      ],
    );
  }
}
