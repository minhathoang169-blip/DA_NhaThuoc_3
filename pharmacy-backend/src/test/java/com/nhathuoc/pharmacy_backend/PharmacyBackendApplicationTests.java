package com.nhathuoc.pharmacy_backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.webAppContextSetup;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class PharmacyBackendApplicationTests {

	@Autowired
	private MockMvc mockMvc;

	@Test
	void contextLoads() {
	}

	@Test
	@WithMockUser
	void productCrudWorks() throws Exception {
		mockMvc.perform(post("/api/medicines")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"id":"TST001","name":"Thuoc kiem thu","category":"Thuoc","price":1200}
						"""))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").value("TST001"));

		mockMvc.perform(put("/api/medicines/TST001")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"name":"Thuoc da cap nhat","category":"Thuoc","price":1500}
						"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.price").value(1500));

		mockMvc.perform(delete("/api/medicines/TST001"))
				.andExpect(status().isNoContent());
	}

	@Test
	@WithMockUser
	void batchCrudWorks() throws Exception {
		mockMvc.perform(post("/api/batches")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"id":"TSTB001","medicineId":"SP001","batchNumber":203001,"expiryDate":"2030-01-01","quantity":5,"purchasePrice":1000}
						"""))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").value("TSTB001"));

		mockMvc.perform(put("/api/batches/TSTB001")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"medicineId":"SP001","batchNumber":203001,"expiryDate":"2030-01-01","quantity":8,"purchasePrice":1000}
						"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.quantity").value(8));

		mockMvc.perform(delete("/api/batches/TSTB001"))
				.andExpect(status().isNoContent());
	}

	@Test
	@WithMockUser
	void customerCrudWorks() throws Exception {
		mockMvc.perform(post("/api/customers")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"id":"TSTKH001","name":"Khach kiem thu","phone":"0900000000","address":"Thu Duc"}
						"""))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").value("TSTKH001"));

		mockMvc.perform(put("/api/customers/TSTKH001")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"name":"Khach da cap nhat","phone":"0911111111","address":"Thu Duc"}
						"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.phone").value("0911111111"));

		mockMvc.perform(delete("/api/customers/TSTKH001"))
				.andExpect(status().isNoContent());
	}

	@Test
	@WithMockUser
	void supplierCrudWorks() throws Exception {
		mockMvc.perform(post("/api/suppliers")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"id":"TSTNCC01","name":"Nha cung cap test","phone":"0900000000","address":"Thu Duc"}
						"""))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").value("TSTNCC01"));

		mockMvc.perform(put("/api/suppliers/TSTNCC01")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"name":"Nha cung cap moi","phone":"0911111111","address":"Thu Duc"}
						"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.name").value("Nha cung cap moi"));

		mockMvc.perform(delete("/api/suppliers/TSTNCC01"))
				.andExpect(status().isNoContent());
	}

	@Test
	@WithMockUser
	void employeeCrudWorks() throws Exception {
		mockMvc.perform(post("/api/employees")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"id":"TSTNV01","name":"Nhan vien test","phone":"0900000000","birthDate":"1990-01-01","role":"Duoc si","startDate":"2024-01-01"}
						"""))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").value("TSTNV01"));

		mockMvc.perform(put("/api/employees/TSTNV01")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"name":"Nhan vien moi","phone":"0911111111","birthDate":"1990-01-01","role":"Duoc si","startDate":"2024-01-01"}
						"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.name").value("Nhan vien moi"));

		mockMvc.perform(delete("/api/employees/TSTNV01"))
				.andExpect(status().isNoContent());
	}

	@Test
	void writeRequestsRequireAuthentication() throws Exception {
		mockMvc.perform(post("/api/medicines")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"id":"TST002","name":"Thuoc","category":"Thuoc","price":1000}
						"""))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void personalDataRequiresAuthentication() throws Exception {
		mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/customers"))
				.andExpect(status().isUnauthorized());
	}

}
