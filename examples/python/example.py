# examples/python/example.py

# Simple singleton-like structure
class Database:
    instance = None
    def __init__(self):
        pass

Database.instance = Database()

# Multiple instantiations
class Worker:
    pass

w1 = Worker()
w2 = Worker()
w3 = Worker()

# Observer-like: register without unregister
def handler(e):
    print('event')

# Hypothetical API
# add_listener('resize', handler)

# Long if-else
def format_output(kind):
    if kind == 'json':
        return '{}'
    elif kind == 'xml':
        return '<xml/>'
    elif kind == 'csv':
        return ','
    elif kind == 'yaml':
        return '---'
    elif kind == 'text':
        return 'txt'
    return ''
