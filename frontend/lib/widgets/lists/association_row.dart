import 'package:flutter/material.dart';

import '../../core/layout_constants.dart';

class AssociationRow extends StatelessWidget {
  final String association;

  const AssociationRow({
    super.key,
    required this.association,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(
          'Asociación:',
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
        ),
        const SizedBox(width: LayoutConstants.spacing12),
        Container(
          padding: const EdgeInsets.symmetric(
            horizontal: LayoutConstants.spacing16,
            vertical: LayoutConstants.spacing6,
          ),
          decoration: BoxDecoration(
            color: const Color(0xFFEFEFFF),
            borderRadius: BorderRadius.circular(LayoutConstants.borderRadius20),
          ),
          child: Text(
            association,
            style: const TextStyle(
              color: Color.fromARGB(255, 0, 0, 0),
              fontWeight: FontWeight.w600,
              fontSize: 14,
            ),
          ),
        ),
      ],
    );
  }
}
