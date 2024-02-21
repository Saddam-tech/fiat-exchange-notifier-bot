const { db } = require("./connect");
const { COLUMNS } = require("./tables");

const columns = [
  COLUMNS.id,
  COLUMNS.firstname,
  COLUMNS.lastname,
  COLUMNS.username,
  COLUMNS.date,
  COLUMNS.lang,
  COLUMNS.pair,
  COLUMNS.interval,
];

function insert_string(table_name, column_names) {
  const values = Array(column_names.length).fill("?").join(", ");
  return `INSERT INTO ${table_name} (${column_names.join(
    ", "
  )}) VALUES (${values})`;
}

async function insert(table, rows) {
  try {
    db.serialize(() => {
      let _insert = insert_string(table, columns);
      let stmt = db.prepare(_insert);
      stmt.run(rows, (err) => {
        if (err) {
          console.error(err);
          // Handle error, perhaps rollback transaction or log
        }
      });
      stmt.finalize();
    });
  } catch (err) {
    console.error(err);
  }
}

async function update(table, params, values, id) {
  try {
    db.serialize(() => {
      const sql = `UPDATE ${table} SET ${params
        .map((param) => `${param} = ?`)
        .join(", ")} WHERE id = ?`;
      let stmt = db.prepare(sql);
      stmt.run([...values, id], (err) => {
        if (err) {
          console.log(err);
        }
      });
      stmt.finalize();
    });
  } catch (err) {
    console.log(err);
  }
}

async function move(from_table, to_table, params, id) {
  try {
    let sql = `DELETE FROM ${from_table} WHERE id = ?`;
    db.serialize(() => {
      insert(to_table, params);
      db.run(sql, [id], (err) => {
        if (err) {
          console.error(err);
        }
      });
    });
  } catch (err) {
    console.error(err);
  }
}

async function query_all(table) {
  try {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        let sql = `SELECT * FROM ${table}`;
        db.all(sql, [], (err, rows) => {
          if (err) {
            reject(err);
          }
          resolve(rows);
        });
      });
    });
  } catch (err) {
    console.error(err);
  }
}

async function query_params(table, param, value) {
  try {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        let sql = `SELECT * FROM ${table} WHERE ${param} = ?`;
        let stmt = db.prepare(sql);
        stmt.all([value], (err, rows) => {
          if (err) {
            reject(err);
          }
          resolve(rows);
        });
        stmt.finalize();
      });
    });
  } catch (err) {
    console.error(err);
  }
}

module.exports = { insert, query_all, query_params, move, update };
