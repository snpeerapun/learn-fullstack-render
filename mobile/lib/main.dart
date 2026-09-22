// main.dart — แอปมือถือ Flutter ที่คุยกับ API ตัวเดียวกับเว็บ React
//
// รันด้วย:
//   flutter run --dart-define=API_URL=https://learn-todo-api.onrender.com
// (ถ้าไม่ใส่ API_URL จะใช้ค่า default ด้านล่าง)
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

// ---------- 1) ค่าคงที่ / config ----------
const String apiUrl = String.fromEnvironment(
  'API_URL',
  defaultValue: 'https://learn-todo-api.onrender.com',
);

// ---------- 2) Model: แปลง JSON ↔ Dart object ----------
class Todo {
  final int id;
  final String title;
  final bool done;
  final DateTime createdAt;

  Todo({required this.id, required this.title, required this.done, required this.createdAt});

  factory Todo.fromJson(Map<String, dynamic> j) => Todo(
        id: j['id'] as int,
        title: j['title'] as String,
        done: j['done'] as bool,
        createdAt: DateTime.parse(j['created_at'] as String).toLocal(),
      );
}

// ---------- 3) Service: รวมทุกการเรียก API ไว้ที่เดียว ----------
class TodoApi {
  final String base;
  TodoApi(this.base);

  Map<String, String> get _headers => {'Content-Type': 'application/json'};

  Future<bool> health() async {
    try {
      final r = await http.get(Uri.parse('$base/api/health')).timeout(const Duration(seconds: 30));
      return r.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  Future<List<Todo>> list() async {
    final r = await http.get(Uri.parse('$base/api/todos')).timeout(const Duration(seconds: 30));
    _check(r);
    final data = jsonDecode(r.body) as List<dynamic>;
    return data.map((e) => Todo.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<Todo> create(String title) async {
    final r = await http.post(Uri.parse('$base/api/todos'),
        headers: _headers, body: jsonEncode({'title': title}));
    _check(r);
    return Todo.fromJson(jsonDecode(r.body) as Map<String, dynamic>);
  }

  Future<Todo> setDone(int id, bool done) async {
    final r = await http.patch(Uri.parse('$base/api/todos/$id'),
        headers: _headers, body: jsonEncode({'done': done}));
    _check(r);
    return Todo.fromJson(jsonDecode(r.body) as Map<String, dynamic>);
  }

  Future<void> remove(int id) async {
    final r = await http.delete(Uri.parse('$base/api/todos/$id'));
    _check(r);
  }

  void _check(http.Response r) {
    if (r.statusCode >= 400) {
      String msg = 'HTTP ${r.statusCode}';
      try {
        msg = (jsonDecode(r.body) as Map)['error']?.toString() ?? msg;
      } catch (_) {}
      throw Exception(msg);
    }
  }
}

// ---------- 4) App ----------
void main() => runApp(const LearnTodoApp());

class LearnTodoApp extends StatelessWidget {
  const LearnTodoApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Learn Todo',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorSchemeSeed: const Color(0xFF2563EB),
        useMaterial3: true,
        scaffoldBackgroundColor: const Color(0xFFF4F6FB),
      ),
      home: const TodoPage(),
    );
  }
}

// ---------- 5) หน้าจอหลัก (StatefulWidget = มี state ที่เปลี่ยนได้) ----------
class TodoPage extends StatefulWidget {
  const TodoPage({super.key});

  @override
  State<TodoPage> createState() => _TodoPageState();
}

class _TodoPageState extends State<TodoPage> {
  final api = TodoApi(apiUrl);
  final controller = TextEditingController();

  List<Todo> todos = [];
  bool loading = true;
  bool? apiOk; // null = ยังไม่รู้
  String? error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => loading = true);
    apiOk = await api.health();
    try {
      todos = await api.list();
      error = null;
    } catch (e) {
      error = e.toString();
    }
    if (mounted) setState(() => loading = false);
  }

  Future<void> _add() async {
    final title = controller.text.trim();
    if (title.isEmpty) return;
    try {
      final t = await api.create(title);
      setState(() {
        todos.insert(0, t);
        controller.clear();
      });
    } catch (e) {
      _snack(e.toString());
    }
  }

  Future<void> _toggle(Todo t) async {
    try {
      final u = await api.setDone(t.id, !t.done);
      setState(() => todos = todos.map((x) => x.id == t.id ? u : x).toList());
    } catch (e) {
      _snack(e.toString());
    }
  }

  Future<void> _delete(Todo t) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('ลบรายการนี้?'),
        content: Text(t.title),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('ยกเลิก')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('ลบ')),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await api.remove(t.id);
      setState(() => todos.removeWhere((x) => x.id == t.id));
    } catch (e) {
      _snack(e.toString());
    }
  }

  void _snack(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  @override
  Widget build(BuildContext context) {
    final doneCount = todos.where((t) => t.done).length;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Learn Todo'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: Chip(
              avatar: Icon(
                apiOk == true ? Icons.check_circle : Icons.error,
                size: 18,
                color: apiOk == true ? Colors.green : Colors.red,
              ),
              label: Text(apiOk == null ? 'เช็ค API…' : (apiOk! ? 'API ติด' : 'API ไม่ตอบ')),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // ช่องเพิ่มรายการ
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: controller,
                    onSubmitted: (_) => _add(),
                    decoration: const InputDecoration(
                      hintText: 'พิมพ์สิ่งที่ต้องทำ',
                      border: OutlineInputBorder(),
                      filled: true,
                      fillColor: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                FilledButton.icon(onPressed: _add, icon: const Icon(Icons.add), label: const Text('เพิ่ม')),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('รายการ (${todos.length})', style: const TextStyle(fontWeight: FontWeight.w600)),
                Text('เสร็จแล้ว $doneCount', style: TextStyle(color: Colors.grey[600])),
              ],
            ),
          ),
          const SizedBox(height: 8),
          // รายการ
          Expanded(
            child: RefreshIndicator(
              onRefresh: _load,
              child: loading
                  ? const Center(child: CircularProgressIndicator())
                  : error != null
                      ? _Message(icon: Icons.cloud_off, text: error!)
                      : todos.isEmpty
                          ? const _Message(icon: Icons.inbox, text: 'ยังไม่มีรายการ ลองเพิ่มอันแรกดูสิ')
                          : ListView.separated(
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              itemCount: todos.length,
                              separatorBuilder: (_, __) => const SizedBox(height: 8),
                              itemBuilder: (_, i) {
                                final t = todos[i];
                                return Card(
                                  elevation: 0,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    side: BorderSide(color: Colors.grey.shade300),
                                  ),
                                  child: ListTile(
                                    leading: Checkbox(value: t.done, onChanged: (_) => _toggle(t)),
                                    title: Text(
                                      t.title,
                                      style: TextStyle(
                                        decoration: t.done ? TextDecoration.lineThrough : null,
                                        color: t.done ? Colors.grey : null,
                                      ),
                                    ),
                                    subtitle: Text(_fmt(t.createdAt)),
                                    trailing: IconButton(
                                      icon: const Icon(Icons.delete_outline),
                                      onPressed: () => _delete(t),
                                    ),
                                    onTap: () => _toggle(t),
                                  ),
                                );
                              },
                            ),
            ),
          ),
        ],
      ),
    );
  }

  String _fmt(DateTime d) {
    String two(int n) => n.toString().padLeft(2, '0');
    return '${two(d.day)}/${two(d.month)}/${d.year} ${two(d.hour)}:${two(d.minute)}';
  }
}

class _Message extends StatelessWidget {
  final IconData icon;
  final String text;
  const _Message({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: [
        const SizedBox(height: 80),
        Icon(icon, size: 48, color: Colors.grey),
        const SizedBox(height: 12),
        Center(child: Text(text, style: TextStyle(color: Colors.grey[700]), textAlign: TextAlign.center)),
      ],
    );
  }
}
