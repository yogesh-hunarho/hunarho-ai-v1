import { NextResponse } from "next/server";


// function generateUsersWithDuplicateEmails(count: number) {
//   return Array.from({ length: count }, (_, i) => ({
//     userId: `USER_${i}`,
//     email: i % 5 === 0 ? "duplicate@test.com" : `user${i}@test.com`,
//     name: `User ${i}`,
//   }));
// }

// export async function POST() {
//   try {
//     const users = generateUsersWithDuplicateEmails(100);

//     return NextResponse.json(users, { status: 201 });
//   } catch {
//     return NextResponse.json(
//       { error: "Failed to generate users" },
//       { status: 500 }
//     );
//   }
// }

const users =[
    {
        "id": 1,
        "first_name": "staff",
        "last_name": "Hunar",
        "email": "staff@hunarho.com",
        "created_at": "2022-12-15 08:20:43"
    },
    {
        "id": 2,
        "first_name": "Rahul",
        "last_name": "Chandra",
        "email": "harsh.hunarho@gmail.com",
        "created_at": "2025-11-01 11:56:25"
    },
    {
        "id": 3,
        "first_name": "Rahul",
        "last_name": "Gandhi",
        "email": "iamyogesh2104@gmail.com",
        "created_at": "2025-11-01 12:11:18"
    },
    {
        "id": 71,
        "first_name": "Aarav",
        "last_name": "Sharma",
        "email": "aarav.sharma@example.com",
        "created_at": "2025-11-01 13:00:14"
    },
    {
        "id": 72,
        "first_name": "Isha",
        "last_name": "Patel",
        "email": "isha.patel@example.com",
        "created_at": "2025-11-01 13:00:14"
    },
    {
        "id": 73,
        "first_name": "Riya",
        "last_name": "Verma",
        "email": "riya.verma@example.com",
        "created_at": "2025-11-01 13:00:14"
    },
    {
        "id": 74,
        "first_name": "Sarthak",
        "last_name": "Mehta",
        "email": "sarthak.mehta@example.com",
        "created_at": "2025-11-01 13:00:14"
    },
    {
        "id": 75,
        "first_name": "Karan",
        "last_name": "Kapoor",
        "email": "karan.kapoor@example.com",
        "created_at": "2025-11-01 13:00:14"
    },
    {
        "id": 76,
        "first_name": "Meera",
        "last_name": "Iyer",
        "email": "meera.iyer@example.com",
        "created_at": "2025-11-01 13:00:14"
    },
    {
        "id": 77,
        "first_name": "Shreya",
        "last_name": "Singh",
        "email": "shreya.singh@example.com",
        "created_at": "2025-11-01 13:00:14"
    },
    {
        "id": 78,
        "first_name": "Rohit",
        "last_name": "Nair",
        "email": "rohit.nair@example.com",
        "created_at": "2025-11-01 13:00:14"
    },
    {
        "id": 79,
        "first_name": "Anjali",
        "last_name": "Gupta",
        "email": "anjali.gupta@example.com",
        "created_at": "2025-11-01 13:00:14"
    },
    {
        "id": 80,
        "first_name": "Tanvi",
        "last_name": "Joshi",
        "email": "tanvi.joshi@example.com",
        "created_at": "2025-11-01 13:00:14"
    },
    {
        "id": 81,
        "first_name": "John",
        "last_name": "Walker",
        "email": "johnthedon@gmail.com",
        "created_at": "2025-11-01 14:15:10"
    },
    {
        "id": 82,
        "first_name": "Emmy",
        "last_name": "Shawel",
        "email": "eshawel1@cbslocal.com",
        "created_at": "2025-11-01 14:15:10"
    },
    {
        "id": 83,
        "first_name": "Denice",
        "last_name": "Jados",
        "email": "ys32809@gmail.com",
        "created_at": "2025-11-01 14:15:10"
    },
    {
        "id": 84,
        "first_name": "Morgan",
        "last_name": "MacGillivrie",
        "email": "yogesh.singh@hunarho.com",
        "created_at": "2025-11-01 14:15:10"
    },
    {
        "id": 85,
        "first_name": "Willodean",
        "last_name": "Stockman",
        "email": "dev.yogeshsingh21@gmail.com",
        "created_at": "2025-11-11 10:08:46"
    },
    {
        "id": 86,
        "first_name": "Dhoni",
        "last_name": "Singh",
        "email": "dhonisingh123@gmail.com",
        "created_at": "2025-11-15 11:32:26"
    },
    {
        "id": 87,
        "first_name": "Rohit",
        "last_name": "Sharma",
        "email": "adam.wilkins@example.com",
        "created_at": "2025-11-15 12:09:37"
    },
    {
        "id": 88,
        "first_name": "Jeffrey",
        "last_name": "Spence",
        "email": "jeffrey.spence@example.com",
        "created_at": "2025-11-15 12:09:37"
    },
    {
        "id": 89,
        "first_name": "Linda",
        "last_name": "Cuevas",
        "email": "linda.cuevas@example.com",
        "created_at": "2025-11-15 12:09:37"
    },
    {
        "id": 90,
        "first_name": "William",
        "last_name": "Wallace",
        "email": "william.wallace@example.com",
        "created_at": "2025-11-15 12:09:37"
    },
    {
        "id": 91,
        "first_name": "Steven",
        "last_name": "Nichols",
        "email": "steven.nichols@example.com",
        "created_at": "2025-11-15 12:09:37"
    },
    {
        "id": 92,
        "first_name": "Jacqueline",
        "last_name": "Spencer",
        "email": "jacqueline.spencer@example.com",
        "created_at": "2025-11-15 12:09:37"
    },
    {
        "id": 93,
        "first_name": "Johnny",
        "last_name": "Torres",
        "email": "johnny.torres@example.com",
        "created_at": "2025-11-15 12:09:37"
    },
    {
        "id": 94,
        "first_name": "Gregory",
        "last_name": "Yu",
        "email": "gregory.yu@example.com",
        "created_at": "2025-11-15 12:09:37"
    },
    {
        "id": 95,
        "first_name": "Susan",
        "last_name": "Price",
        "email": "susan.price@example.com",
        "created_at": "2025-11-15 12:09:37"
    },
    {
        "id": 96,
        "first_name": "Alexis",
        "last_name": "Ball",
        "email": "alexis.ball@example.com",
        "created_at": "2025-11-15 12:09:37"
    },
    {
        "id": 97,
        "first_name": "Tanishq",
        "last_name": "Sheikh",
        "email": "tanishq@test.com",
        "created_at": "2025-11-17 10:26:54"
    },
    {
        "id": 98,
        "first_name": "PREM",
        "last_name": "SHEJPAL",
        "email": "ravi@gmail.com",
        "created_at": "2025-11-19 10:18:53"
    },
    {
        "id": 99,
        "first_name": "Rohit",
        "last_name": "Sharma",
        "email": "rohit@gmail.com",
        "created_at": "2025-11-27 11:45:01"
    },
    {
        "id": 100,
        "first_name": "Pratik",
        "last_name": "shah",
        "email": "pratik@test.com",
        "created_at": "2025-12-04 12:18:16"
    },
    {
        "id": 101,
        "first_name": "Aarav",
        "last_name": "Sharma",
        "email": "aarav.sharma@test.com",
        "created_at": "2025-12-04 12:34:08"
    },
    {
        "id": 102,
        "first_name": "Priya",
        "last_name": "Patel",
        "email": "priya.patel@test.com",
        "created_at": "2025-12-04 12:34:08"
    },
    {
        "id": 103,
        "first_name": "Rohan",
        "last_name": "Verma",
        "email": "rohan.verma@test.com",
        "created_at": "2025-12-04 12:34:08"
    },
    {
        "id": 104,
        "first_name": "Sneha",
        "last_name": "Nair",
        "email": "sneha.nair@test.com",
        "created_at": "2025-12-04 12:34:08"
    },
    {
        "id": 105,
        "first_name": "Kunal",
        "last_name": "Singh",
        "email": "kunal.singh@test.com",
        "created_at": "2025-12-04 12:34:08"
    },
    {
        "id": 106,
        "first_name": "Ananya",
        "last_name": "Iyer",
        "email": "ananya.iyer@test.com",
        "created_at": "2025-12-04 12:34:08"
    },
    {
        "id": 107,
        "first_name": "Rahul",
        "last_name": "Gupta",
        "email": "rahul.gupta@test.com",
        "created_at": "2025-12-04 12:34:08"
    },
    {
        "id": 108,
        "first_name": "Kavya",
        "last_name": "Reddy",
        "email": "kavya.reddy@test.com",
        "created_at": "2025-12-04 12:34:08"
    },
    {
        "id": 109,
        "first_name": "Aditya",
        "last_name": "Mehta",
        "email": "aditya.mehta@test.com",
        "created_at": "2025-12-04 12:34:08"
    },
    {
        "id": 110,
        "first_name": "Varsha",
        "last_name": "Desai",
        "email": "varsha.desai@test.com",
        "created_at": "2025-12-04 12:34:08"
    },
    {
        "id": 111,
        "first_name": "Manish",
        "last_name": "Bhat",
        "email": "manish.bhat@test.com",
        "created_at": "2025-12-04 12:34:08"
    },
    {
        "id": 112,
        "first_name": "Tanvi",
        "last_name": "Kulkarni",
        "email": "tanvi.kulkarni@test.com",
        "created_at": "2025-12-04 12:34:08"
    },
    {
        "id": 113,
        "first_name": "Siddharth",
        "last_name": "Joshi",
        "email": "siddharth.joshi@test.com",
        "created_at": "2025-12-04 12:34:08"
    },
    {
        "id": 114,
        "first_name": "Pooja",
        "last_name": "Choudhary",
        "email": "pooja.choudhary@test.com",
        "created_at": "2025-12-04 12:34:08"
    },
    {
        "id": 115,
        "first_name": "Arjun",
        "last_name": "Rao",
        "email": "arjun.rao@test.com",
        "created_at": "2025-12-04 12:34:08"
    },
    {
        "id": 116,
        "first_name": "Meera",
        "last_name": "Pillai",
        "email": "meera.pillai@test.com",
        "created_at": "2025-12-04 12:34:08"
    },
    {
        "id": 117,
        "first_name": "Dev",
        "last_name": "Malhotra",
        "email": "dev.malhotra@test.com",
        "created_at": "2025-12-04 12:34:08"
    },
    {
        "id": 118,
        "first_name": "Ishita",
        "last_name": "Saxena",
        "email": "ishita.saxena@test.com",
        "created_at": "2025-12-04 12:34:08"
    },
    {
        "id": 119,
        "first_name": "Vikram",
        "last_name": "Shetty",
        "email": "vikram.shetty@test.com",
        "created_at": "2025-12-04 12:34:08"
    },
    {
        "id": 120,
        "first_name": "Neha",
        "last_name": "Ghosh",
        "email": "neha.ghosh@test.com",
        "created_at": "2025-12-04 12:34:08"
    },
    {
        "id": 121,
        "first_name": "Janavi",
        "last_name": "joy",
        "email": "janavi@test.com",
        "created_at": "2025-12-04 12:53:26"
    },
    {
        "id": 122,
        "first_name": "first_name",
        "last_name": "last_name",
        "email": "email",
        "created_at": "2025-12-12 14:36:56"
    },
    {
        "id": 123,
        "first_name": "Joy",
        "last_name": "Hamilton",
        "email": "mcphersonjames@yahoo.com",
        "created_at": "2025-12-12 14:36:56"
    },
    {
        "id": 124,
        "first_name": "Stephanie",
        "last_name": "Johnson",
        "email": "brittneymunoz@gmail.com",
        "created_at": "2025-12-12 14:36:56"
    },
    {
        "id": 125,
        "first_name": "Sara",
        "last_name": "Taylor",
        "email": "support@hunarho.com",
        "created_at": "2025-12-12 14:36:56"
    },
    {
        "id": 126,
        "first_name": "Troy",
        "last_name": "Taylor",
        "email": "harsh.chhabhaiya@hunarho.com",
        "created_at": "2025-12-12 14:36:56"
    },
    {
        "id": 127,
        "first_name": "Christian",
        "last_name": "Green",
        "email": "andrewbest@yahoo.com",
        "created_at": "2025-12-12 14:36:56"
    },
    {
        "id": 128,
        "first_name": "Patricia",
        "last_name": "Hall",
        "email": "meghanhopkins@gmail.com",
        "created_at": "2025-12-12 14:36:56"
    },
    {
        "id": 129,
        "first_name": "Shirley",
        "last_name": "Lopez",
        "email": "odonnellkeith@robinson-schwartz.com",
        "created_at": "2025-12-12 14:36:56"
    },
    {
        "id": 130,
        "first_name": "Randall",
        "last_name": "Greene",
        "email": "alicemarks@gmail.com",
        "created_at": "2025-12-12 14:36:56"
    },
    {
        "id": 131,
        "first_name": "Jane",
        "last_name": "Page",
        "email": "townsenddebra@parrish-wallace.com",
        "created_at": "2025-12-12 14:36:56"
    },
    {
        "id": 132,
        "first_name": "Danielle",
        "last_name": "Scott",
        "email": "villegasjames@rubio.com",
        "created_at": "2025-12-12 14:36:56"
    },
    {
        "id": 133,
        "first_name": "Asha",
        "last_name": "Patil",
        "email": "asha.patil@dummy.com",
        "created_at": "2025-12-12 14:36:56"
    },
    {
        "id": 134,
        "first_name": "Rohan",
        "last_name": "Deshmukh",
        "email": "rohan.deshmukh@dummy.com",
        "created_at": "2025-12-12 14:36:56"
    },
    {
        "id": 135,
        "first_name": "Neha",
        "last_name": "Shah",
        "email": "neha.shah@dummy.com",
        "created_at": "2025-12-12 14:36:56"
    },
    {
        "id": 136,
        "first_name": "Kiran",
        "last_name": "More",
        "email": "kiran.more@dummy.com",
        "created_at": "2025-12-12 14:36:56"
    },
    {
        "id": 137,
        "first_name": "Priya",
        "last_name": "Jadhav",
        "email": "priya.jadhav@dummy.com",
        "created_at": "2025-12-12 14:36:56"
    },
    {
        "id": 138,
        "first_name": "Amit",
        "last_name": "Kulkarni",
        "email": "amit.kulkarni@dummy.com",
        "created_at": "2025-12-12 14:36:56"
    },
    {
        "id": 139,
        "first_name": "Meera",
        "last_name": "Khatri",
        "email": "meera.khatri@dummy.com",
        "created_at": "2025-12-12 14:48:49"
    },
    {
        "id": 140,
        "first_name": "Aditya",
        "last_name": "Gokhale",
        "email": "aditya.gokhale@dummy.com",
        "created_at": "2025-12-12 14:48:49"
    },
    {
        "id": 141,
        "first_name": "Sara",
        "last_name": "Naik",
        "email": "sara.naik@dummy.com",
        "created_at": "2025-12-12 14:48:49"
    },
    {
        "id": 142,
        "first_name": "Varun",
        "last_name": "Shinde",
        "email": "varun.shinde@dummy.com",
        "created_at": "2025-12-12 14:48:49"
    },
    {
        "id": 143,
        "first_name": "Sneha",
        "last_name": "Borse",
        "email": "sneha.borse@dummy.com",
        "created_at": "2025-12-12 14:48:49"
    },
    {
        "id": 144,
        "first_name": "Harsh",
        "last_name": "Tiwari",
        "email": "harsh.tiwari@dummy.com",
        "created_at": "2025-12-12 14:48:49"
    },
    {
        "id": 145,
        "first_name": "Kavita",
        "last_name": "Pawar",
        "email": "kavita.pawar@dummy.com",
        "created_at": "2025-12-12 14:48:49"
    },
    {
        "id": 146,
        "first_name": "Manish",
        "last_name": "Verma",
        "email": "manish.verma@dummy.com",
        "created_at": "2025-12-12 14:48:49"
    },
    {
        "id": 147,
        "first_name": "Rutuja",
        "last_name": "Lokhande",
        "email": "rutuja.lokhande@dummy.com",
        "created_at": "2025-12-12 14:48:49"
    },
    {
        "id": 148,
        "first_name": "Omkar",
        "last_name": "Salvi",
        "email": "omkar.salvi@dummy.com",
        "created_at": "2025-12-12 14:48:49"
    },
    {
        "id": 149,
        "first_name": "Tanvi",
        "last_name": "Kadam",
        "email": "tanvi.kadam@dummy.com",
        "created_at": "2025-12-12 14:48:49"
    },
    {
        "id": 150,
        "first_name": "Siddharth",
        "last_name": "Jaiswal",
        "email": "siddharth.jaiswal@dummy.com",
        "created_at": "2025-12-12 14:48:49"
    },
    {
        "id": 151,
        "first_name": "Pooja",
        "last_name": "Mahajan",
        "email": "pooja.mahajan@dummy.com",
        "created_at": "2025-12-12 14:48:49"
    },
    {
        "id": 152,
        "first_name": "Rahul",
        "last_name": "Wagh",
        "email": "rahul.wagh@dummy.com",
        "created_at": "2025-12-12 14:48:49"
    },
    {
        "id": 153,
        "first_name": "Ananya",
        "last_name": "Chavan",
        "email": "ananya.chavan@dummy.com",
        "created_at": "2025-12-12 14:48:49"
    },
    {
        "id": 154,
        "first_name": "Tejas",
        "last_name": "Rane",
        "email": "singhyogesh2104@gmail.com",
        "created_at": "2025-12-12 14:48:49"
    },
    {
        "id": 155,
        "first_name": "Juhi",
        "last_name": "Shetty",
        "email": "juhi.shetty@dummy.com",
        "created_at": "2025-12-12 14:48:49"
    },
    {
        "id": 156,
        "first_name": "Arnav",
        "last_name": "Pingle",
        "email": "arnav.pingle@dummy.com",
        "created_at": "2025-12-12 14:48:49"
    },
    {
        "id": 157,
        "first_name": "Payal",
        "last_name": "Gujar",
        "email": "payal.gujar@dummy.com",
        "created_at": "2025-12-12 14:48:49"
    },
    {
        "id": 158,
        "first_name": "Nikhil",
        "last_name": "Jagtap",
        "email": "nikhil.jagtap@dummy.com",
        "created_at": "2025-12-12 14:48:49"
    },
    {
        "id": 159,
        "first_name": "Yogesh",
        "last_name": "Taylor",
        "email": "mgmuser1@gmail.com",
        "created_at": "2025-12-17 12:45:51"
    },
    {
        "id": 160,
        "first_name": "Aisha",
        "last_name": "Patel",
        "email": "aisha.patel@example.com",
        "created_at": "2025-12-31 13:21:19"
    }
]

const formattedUsers = users.map(user => ({
  name: `${user.first_name} ${user.last_name}`,
  email: user.email,
  userId: String(user.id)
}));


export async function POST() {
  try {
    const users = formattedUsers;

    return NextResponse.json(users, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate users" },
      { status: 500 }
    );
  }
}