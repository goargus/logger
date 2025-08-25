import 'package:flutter/material.dart';

class UserTile extends StatelessWidget {
  final String name;
  final String email;
  final bool darkVariant; // en sidebar oscuro

  const UserTile({
    super.key,
    required this.name,
    required this.email,
    this.darkVariant = false,
  });

  @override
  Widget build(BuildContext context) {
    final color = darkVariant ? Colors.white : Colors.black87;
    return Row(
      children: [
        CircleAvatar(backgroundColor: Colors.white24, child: Icon(Icons.person, color: color)),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(name, style: TextStyle(color: color, fontWeight: FontWeight.w700)),
              Text(email, style: TextStyle(color: color.withOpacity(.8), fontSize: 12)),
            ],
          ),
        ),
      ],
    );
  }
}
